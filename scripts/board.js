const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";
const COL_TO_STATE = {
  todo: "toDo",
  "in-progress": "in progress",
  "await-feedback": "await feedback",
  done: "done",
};
const STATE_TO_COL = Object.fromEntries(Object.entries(COL_TO_STATE).map(([c, s]) => [s, c]));

let dragged = null;       // currently dragged card (container)
let placeholder = null;   // placeholder while dragging
let __liveBound = false;  // avoid double-binding live listeners
let __tasksRef = null;    // RTDB ref to "tasks"
const __localEdits = new Set(); // mark local edits to detect echo updates

// Entry point: init board, overlay buttons and subtask listener
document.addEventListener("DOMContentLoaded", () => {
  init();
  bindOverlayButtons();
  mountSubtaskCheckboxListener();
  //mountDatePickerMinToday();
});

// Main init: render, live sync, DnD, highlight, etc.
async function init(){
  try { await renderAllTasks(); }
  catch (e) {
    console.error("Initial render failed:", e);
    clearColumns();            // zeigt die Empty States statt weißer Fläche
  }
  startLiveSync();
  initDnd();
  highlightNewTask();
  checkSwapMenu();
}

// Briefly highlight newly created task card (via ?newTask=ID)
function highlightNewTask() {
  const id = new URLSearchParams(location.search).get("newTask");
  const el = id && document.querySelector(`.task-container[data-id="${id}"]`);
  if (!el) return;
  el.classList.add("highlight");
  setTimeout(() => el.classList.remove("highlight"), 2000);
}

// Initialize Drag & Drop only once
function initDnd() {
  if (window.__dndInitialized) return;
  window.__dndInitialized = true;
  makePlaceholder();
  bindGlobalDrag();
  bindColumns();
}

// Create the placeholder element
function makePlaceholder() {
  placeholder = document.createElement("div");
  placeholder.className = "task-placeholder";
}

// Bind global drag start/end listeners
function bindGlobalDrag() {
  document.addEventListener("dragstart", onDragStart);
  document.addEventListener("dragend", onDragEnd);
}

// On start: remember dragged card and add styles
function onDragStart(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  dragged = box;
  box.classList.add("is-dragging");
  box.querySelector(".card")?.classList.add("is-dragging");
  e.dataTransfer?.setData("text/plain", box.dataset.id || "");
}

// On end: clear styles and reset state
function onDragEnd(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  box.classList.remove("is-dragging");
  box.querySelector(".card")?.classList.remove("is-dragging");
  document.querySelectorAll(".dropzone.is-over").forEach((z) => z.classList.remove("is-over"));
  placeholder.remove();
  dragged = null;
}

// Prepare drop zones (dragover, drop, leave)
function bindColumns() {
  document.querySelectorAll(".dropzone").forEach((zone) => {
    if (zone.__bound) return;
    zone.addEventListener("dragover", (ev) => onDragOver(ev, zone));
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (ev) => onDrop(ev, zone));
    zone.__bound = true;
  });
}

// Gentle autoscroll near top/bottom edges of the column
function autoScroll(zone, clientY) {
  const r = zone.getBoundingClientRect(),
    thr = 24;
  if (clientY < r.top + thr) zone.scrollTop -= 10;
  else if (clientY > r.bottom - thr) zone.scrollTop += 10;
}

// While dragging: position placeholder accordingly
function onDragOver(e, zone) {
  if (!dragged) return;
  e.preventDefault();
  zone.classList.add("is-over");
  if (!zone.contains(placeholder)) zone.appendChild(placeholder);
  autoScroll(zone, e.clientY);
  insertPlaceholder(zone, e.clientY);
}

// Replace placeholder with the dragged card
function insertDraggedInto(zone, mouseY) {
  insertPlaceholder(zone, mouseY);
  placeholder.replaceWith(dragged);
}

// After drop: save state to RTDB and update empty states
async function persistDragState(id, zone) {
  await updateTaskState(id, COL_TO_STATE[zone.id]);
  updateEmptyState(zone);
}

// Drop handler: move, persist, and revert on error
async function onDrop(e, zone) {
  e.preventDefault();
  zone.classList.remove("is-over");
  if (!dragged) return;
  const prev = dragged.parentElement;
  insertDraggedInto(zone, e.clientY);
  try {await persistDragState(dragged.dataset.id, zone);
    updateEmptyState(prev);
  } catch (err) {
    console.error(err);
    prev.appendChild(dragged);
    updateEmptyState(prev);
    updateEmptyState(zone);
  }
}

// Compute placeholder position inside a column
function insertPlaceholder(container, mouseY) {
  const items = [...container.querySelectorAll(".task-container:not(.is-dragging)")];
  if (!container.contains(placeholder)) container.appendChild(placeholder);
  const target = items.reduce(
    (acc, el) => {
      const box = el.getBoundingClientRect();
      const off = mouseY - box.top - box.height / 2;
      return off < 0 && off > acc.offset ? { offset: off, el } : acc;},
    { offset: -Infinity, el: null }
  ).el;
  target ? container.insertBefore(placeholder, target) : container.appendChild(placeholder);
}

// Manage "No tasks …" empty-state visibility
function updateEmptyState(zone) {
  if (!zone) return;
  const hasTask = zone.querySelector(".task-container");
  const empty = zone.querySelector(".empty");
  if (!hasTask && !empty) {
    const title = zone.previousElementSibling?.textContent?.trim() || "";
    zone.innerHTML = `<div class="empty">No tasks ${title}</div>`;
  } else if (hasTask && empty) {
    empty.remove();
  }
}

// Refresh empty states in all columns
function updateAllEmptyStates() {
  document.querySelectorAll(".dropzone").forEach(updateEmptyState);
}

// Clear all columns completely (full rebuild)
function clearColumns() {
  document.querySelectorAll(".dropzone").forEach((z) => {
    const title = z.previousElementSibling?.textContent?.trim() || "";
    z.innerHTML = `<div class="empty">No tasks ${title}</div>`;
  });
}

// RTDB: update state (with short-lived local-edit mark to ignore echo)
async function updateTaskState(id, state) {
  __localEdits.add(id);
  setTimeout(() => __localEdits.delete(id), 1500);
  const res = await fetch(`${BASE_URL}/tasks/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
}

// Fetch all tasks; normalize array-form to object
async function fetchTasks() {
  const r = await fetch(`${BASE_URL}/tasks.json`);
  if (!r.ok) throw new Error(`GET tasks failed: ${r.status}`);
  const data = await r.json();
  if (!data) return {};
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((t, i) => [i, t]).filter(([, t]) => t));}
  return data;
}

// Fetch a single task by ID
async function fetchSingleTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`);
  if (!r.ok) throw new Error(`GET task ${id} failed: ${r.status}`);
  return (await r.json()) || {};
}

// Delete a task by ID
async function deleteTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`, { method: "DELETE" });
  if (!r.ok) throw new Error(`DELETE task ${id} failed: ${r.status}`);
}

// Toggle subtask checkbox and persist changes
async function toggleSubtaskDone(taskId, index, done) {
  const t = await fetchSingleTask(taskId);
  const subs = normalizeSubtasks(t.subtasks);
  if (subs[index] == null) return;
  subs[index] = toSubtask(subs[index]);
  subs[index].done = !!done;
  await saveSubtasks(taskId, subs);
}

// Subtask helpers (normalize shape)
function normalizeSubtasks(subs) {
  return Array.isArray(subs) ? subs : [];
}
function toSubtask(x) {
  return typeof x === "string" ? { text: x, done: false } : x || { text: "", done: false };
}

// Save full subtasks array via PATCH
async function saveSubtasks(taskId, subs) {
  const r = await fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: subs }),
  });
  if (!r.ok) throw new Error(`PATCH subtasks failed: ${r.status}`);
}

// Rebuild board: clear, render all cards, update empties
async function renderAllTasks() {
  const tasks = await fetchTasks();
  clearColumns();
  Object.entries(tasks).forEach(([id, t]) => addTaskCard(id, t));
  updateAllEmptyStates();
}

// Compute card HTML from your shared template
function computeCardHTML(t) {
  const { total, done, percent } = subtaskProgress(t.subtasks);
  return window.taskCardInnerHtml(t, percent, done, total);
}

// Insert card into the proper column
function addTaskCard(id, t) {
  const zone = getZoneForTask(t);
  zone.querySelector(".empty")?.remove();
  const wrap = makeTaskWrapper(id);
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = id;
  card.innerHTML = computeCardHTML(t);
  bindCardClickDrag(wrap, card, id);
  wrap.appendChild(card);
  zone.appendChild(wrap);
}

// Resolve correct dropzone element from task state
function getZoneForTask(t) {
  const colId = STATE_TO_COL[t?.state] || "todo";
  return document.getElementById(colId);
}

// Create DnD wrapper for a card
function makeTaskWrapper(id) {
  const w = document.createElement("div");
  w.className = "task-container";
  w.dataset.id = id;
  w.draggable = true;
  return w;
}

// Calculate subtask progress (done/total/percent)
function subtaskProgress(subs) {
  const list = Array.isArray(subs) ? subs : [];
  const total = list.length;
  const done = list.reduce((n, s) => n + (typeof s === "object" && s?.done ? 1 : 0), 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

// Click opens detail overlay; clicks during drag are ignored
function bindCardClickDrag(wrapper, card, id) {
  let draggedFlag = false;
  wrapper.addEventListener("dragstart", () => (draggedFlag = true));
  wrapper.addEventListener("dragend", () => setTimeout(() => (draggedFlag = false), 0));
  card.addEventListener("click", () => !draggedFlag && openTaskDetail(id));
}

function startLiveSync() {
  if (__liveBound) return;
  if (!window.rtdb) {
    console.warn("RTDB not initialized – skipping live sync.");
    return;}
  __liveBound = true;
  __tasksRef = window.rtdb.ref("tasks");
  bindLiveHandlers(__tasksRef);
}

// Bind RTDB event handlers
function bindLiveHandlers(ref) {
  ref.on("child_added", onChildAdded);
  ref.on("child_changed", onChildChanged);
  ref.on("child_removed", onChildRemoved);
}

// RTDB: task added → insert card
function onChildAdded(snap) {
  upsertTaskCard(snap.key, snap.val());
  updateAllEmptyStates();
}

// RTDB: task changed → update/move card
function onChildChanged(snap) {
  const id = snap.key,
    t = snap.val();
  if (__localEdits.has(id)) {
    safeUpdateCardContent(id, t);
    return;}
  handleChangedPlacement(id, t);
}

// Move card if column changed; otherwise update content
function handleChangedPlacement(id, t) {
  const existing = document.querySelector(`.task-container[data-id="${id}"]`);
  const zone = getZoneForTask(t);
  if (existing && existing.parentElement === zone) {
    safeUpdateCardContent(id, t);
    updateAllEmptyStates();
    return;
  }
  upsertTaskCard(id, t);
  updateAllEmptyStates();
}

// RTDB: task removed → delete card
function onChildRemoved(snap) {
  removeTaskCard(snap.key);
  updateAllEmptyStates();
}

// Safely replace card HTML (or recreate if missing)
function safeUpdateCardContent(id, t) {
  const existing = document.querySelector(`.task-container[data-id="${id}"]`);
  if (!existing) {
    upsertTaskCard(id, t);
    updateAllEmptyStates();
    return;
  }
  const card = existing.querySelector(".card");
  card.innerHTML = computeCardHTML(t);
}

// Create/update card and place it in the proper column
function upsertTaskCard(id, t) {
  const existing = document.querySelector(`.task-container[data-id="${id}"]`);
  const zone = getZoneForTask(t);
  zone.querySelector(".empty")?.remove();
  if (!existing) {
    addTaskCard(id, t);
    return;
  }
  existing.querySelector(".card").innerHTML = computeCardHTML(t);
  if (existing.parentElement !== zone) zone.appendChild(existing);
}

// Fully remove a card element
function removeTaskCard(id) {
  document.querySelector(`.task-container[data-id="${id}"]`)?.remove();
}

// On page unload: unsubscribe RTDB listeners
window.addEventListener("beforeunload", () => {
  try {__tasksRef?.off();
  } catch (e) { }
});

window.Board = Object.assign(window.Board || {}, {
  renderAllTasks,
  fetchTasks,
  fetchSingleTask,
  deleteTask,
  toggleSubtaskDone,
});