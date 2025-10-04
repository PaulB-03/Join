const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";

const COL_TO_STATE = {
  todo: "toDo",
  "in-progress": "in progress",
  "await-feedback": "await feedback",
  done: "done",
};
const STATE_TO_COL = Object.fromEntries(
  Object.entries(COL_TO_STATE).map(([c, s]) => [s, c])
);

let dragged = null;
let placeholder = null;

let __liveBound = false;
let __tasksRef = null;
const __localEdits = new Set();

document.addEventListener("DOMContentLoaded", () => {
  init();
  bindOverlayButtons();
  mountSubtaskCheckboxListener();
  mountDatePickerMinToday();
});

async function init() {
  await renderAllTasks();
  startLiveSync();
  initDnd();
  highlightNewTask();
}

function highlightNewTask() {
  const id = new URLSearchParams(location.search).get("newTask");
  const el = id && document.querySelector(`.task-container[data-id="${id}"]`);
  if (!el) return;
  el.classList.add("highlight");
  setTimeout(() => el.classList.remove("highlight"), 2000);
}

function initDnd() {
  if (window.__dndInitialized) return;
  window.__dndInitialized = true;
  makePlaceholder();
  bindGlobalDrag();
  bindColumns();
}

function makePlaceholder() {
  placeholder = document.createElement("div");
  placeholder.className = "task-placeholder";
}

function bindGlobalDrag() {
  document.addEventListener("dragstart", onDragStart);
  document.addEventListener("dragend", onDragEnd);
}

function onDragStart(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  dragged = box;
  box.classList.add("is-dragging");
  box.querySelector(".card")?.classList.add("is-dragging");
  e.dataTransfer?.setData("text/plain", box.dataset.id || "");
}

function onDragEnd(e) {
  const box = e.target.closest(".task-container");
  if (!box) return;
  box.classList.remove("is-dragging");
  box.querySelector(".card")?.classList.remove("is-dragging");
  document.querySelectorAll(".dropzone.is-over").forEach(z => z.classList.remove("is-over"));
  placeholder.remove();
  dragged = null;
}

function bindColumns() {
  document.querySelectorAll(".dropzone").forEach(zone => {
    if (zone.__bound) return;
    zone.addEventListener("dragover", ev => onDragOver(ev, zone));
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", ev => onDrop(ev, zone));
    zone.__bound = true;
  });
}

function autoScroll(zone, clientY) {
  const r = zone.getBoundingClientRect(), thr = 24;
  if (clientY < r.top + thr) zone.scrollTop -= 10;
  else if (clientY > r.bottom - thr) zone.scrollTop += 10;
}

function onDragOver(e, zone) {
  if (!dragged) return;
  e.preventDefault();
  zone.classList.add("is-over");
  if (!zone.contains(placeholder)) zone.appendChild(placeholder); 
  autoScroll(zone, e.clientY);
  insertPlaceholder(zone, e.clientY);
}

function insertDraggedInto(zone, mouseY) {
  insertPlaceholder(zone, mouseY);
  placeholder.replaceWith(dragged);
}

async function persistDragState(id, zone) {
  await updateTaskState(id, COL_TO_STATE[zone.id]);
  updateEmptyState(zone);
}

async function onDrop(e, zone) {
  e.preventDefault();
  zone.classList.remove("is-over");
  if (!dragged) return;
  const prev = dragged.parentElement;

  insertDraggedInto(zone, e.clientY);
  try {
    await persistDragState(dragged.dataset.id, zone);
    updateEmptyState(prev);
  } catch (err) {
    console.error(err);
    prev.appendChild(dragged);
    updateEmptyState(prev);
    updateEmptyState(zone);
  }
}

function insertPlaceholder(container, mouseY) {
  const items = [...container.querySelectorAll(".task-container:not(.is-dragging)")];
  if (!container.contains(placeholder)) container.appendChild(placeholder);
  const target = items.reduce(
    (acc, el) => {
      const box = el.getBoundingClientRect();
      const off = mouseY - box.top - box.height / 2;
      return off < 0 && off > acc.offset ? { offset: off, el } : acc;
    },
    { offset: -Infinity, el: null }
  ).el;
  target ? container.insertBefore(placeholder, target) : container.appendChild(placeholder);
}

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

function updateAllEmptyStates() {
  document.querySelectorAll(".dropzone").forEach(updateEmptyState);
}

function clearColumns() {
  document.querySelectorAll(".dropzone").forEach(z => {
    const title = z.previousElementSibling?.textContent?.trim() || "";
    z.innerHTML = `<div class="empty">No tasks ${title}</div>`;
  });
}

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

async function fetchTasks() {
  const r = await fetch(`${BASE_URL}/tasks.json`);
  if (!r.ok) throw new Error(`GET tasks failed: ${r.status}`);
  const data = await r.json();
  if (!data) return {};
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((t, i) => [i, t]).filter(([, t]) => t));
  }
  return data;
}

async function fetchSingleTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`);
  if (!r.ok) throw new Error(`GET task ${id} failed: ${r.status}`);
  return (await r.json()) || {};
}

async function deleteTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`, { method: "DELETE" });
  if (!r.ok) throw new Error(`DELETE task ${id} failed: ${r.status}`);
}

async function toggleSubtaskDone(taskId, index, done) {
  const t = await fetchSingleTask(taskId);
  const subs = normalizeSubtasks(t.subtasks);
  if (subs[index] == null) return;
  subs[index] = toSubtask(subs[index]);
  subs[index].done = !!done;
  await saveSubtasks(taskId, subs);
}

function normalizeSubtasks(subs) {
  return Array.isArray(subs) ? subs : [];
}

function toSubtask(x) {
  return typeof x === "string" ? { text: x, done: false } : x || { text: "", done: false };
}

async function saveSubtasks(taskId, subs) {
  const r = await fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: subs }),
  });
  if (!r.ok) throw new Error(`PATCH subtasks failed: ${r.status}`);
}

async function renderAllTasks() {
  const tasks = await fetchTasks();
  clearColumns();
  Object.entries(tasks).forEach(([id, t]) => addTaskCard(id, t));
  updateAllEmptyStates();
}

function computeCardHTML(t) {
  const { total, done, percent } = subtaskProgress(t.subtasks);
  return window.taskCardInnerHtml(t, percent, done, total);
}

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

function getZoneForTask(t) {
  const colId = STATE_TO_COL[t?.state] || "todo";
  return document.getElementById(colId);
}

function makeTaskWrapper(id) {
  const w = document.createElement("div");
  w.className = "task-container";
  w.dataset.id = id;
  w.draggable = true;
  return w;
}

function subtaskProgress(subs) {
  const list = Array.isArray(subs) ? subs : [];
  const total = list.length;
  const done = list.reduce((n, s) => n + (typeof s === "object" && s?.done ? 1 : 0), 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

function bindCardClickDrag(wrapper, card, id) {
  let draggedFlag = false;
  wrapper.addEventListener("dragstart", () => (draggedFlag = true));
  wrapper.addEventListener("dragend", () => setTimeout(() => (draggedFlag = false), 0));
  card.addEventListener("click", () => !draggedFlag && openTaskDetail(id));
}

function startLiveSync() {
  if (__liveBound) return;
  if (!window.rtdb) { console.warn("RTDB nicht initialisiert – LiveSync wird übersprungen."); return; }
  __liveBound = true;
  __tasksRef = window.rtdb.ref("tasks");
  bindLiveHandlers(__tasksRef);
}

function bindLiveHandlers(ref) {
  ref.on("child_added", onChildAdded);
  ref.on("child_changed", onChildChanged);
  ref.on("child_removed", onChildRemoved);
}

function onChildAdded(snap) {
  upsertTaskCard(snap.key, snap.val());
  updateAllEmptyStates();
}

function onChildChanged(snap) {
  const id = snap.key, t = snap.val();
  if (__localEdits.has(id)) { safeUpdateCardContent(id, t); return; }
  handleChangedPlacement(id, t);
}

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

function onChildRemoved(snap) {
  removeTaskCard(snap.key);
  updateAllEmptyStates();
}

function safeUpdateCardContent(id, t) {
  const existing = document.querySelector(`.task-container[data-id="${id}"]`);
  if (!existing) { upsertTaskCard(id, t); updateAllEmptyStates(); return; }
  const card = existing.querySelector(".card");
  card.innerHTML = computeCardHTML(t);
}

function upsertTaskCard(id, t) {
  const existing = document.querySelector(`.task-container[data-id="${id}"]`);
  const zone = getZoneForTask(t);
  zone.querySelector(".empty")?.remove();
  if (!existing) { addTaskCard(id, t); return; }
  existing.querySelector(".card").innerHTML = computeCardHTML(t);
  if (existing.parentElement !== zone) zone.appendChild(existing);
}

function removeTaskCard(id) {
  document.querySelector(`.task-container[data-id="${id}"]`)?.remove();
}

window.addEventListener("beforeunload", () => {
  try { __tasksRef?.off(); } catch (e) {}
});

window.Board = Object.assign(window.Board || {}, {
  renderAllTasks,
  fetchTasks,
  fetchSingleTask,
  deleteTask,
  toggleSubtaskDone,
});
