const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";

const COL_TO_STATE = { todo: "toDo", "in-progress": "in progress", "await-feedback": "await feedback", done: "done" };
const STATE_TO_COL = Object.fromEntries(Object.entries(COL_TO_STATE).map(([c, s]) => [s, c]));

let dragged = null;
let placeholder = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  renderAllTasks();
  initDnd();
  highlightNewTask();
  bindOverlayButtons();
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
  document.querySelectorAll(".dropzone").forEach((zone) => {
    if (zone.__bound) return;
    zone.addEventListener("dragover", (ev) => onDragOver(ev, zone));
    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
    zone.addEventListener("drop", (ev) => onDrop(ev, zone));
    zone.__bound = true;
  });
}

function onDragOver(e, zone) {
  if (!dragged) return;
  e.preventDefault();
  zone.classList.add("is-over");
  insertPlaceholder(zone, e.clientY);
}

function onDrop(e, zone) {
  e.preventDefault();
  zone.classList.remove("is-over");
  if (!dragged) return;
  const prev = dragged.parentElement;
  insertPlaceholder(zone, e.clientY);
  placeholder.replaceWith(dragged);
  updateTaskState(dragged.dataset.id, COL_TO_STATE[zone.id]);
  updateEmptyState(prev);
  updateEmptyState(zone);
}

function insertPlaceholder(container, mouseY) {
  const items = [...container.querySelectorAll(".task-container:not(.is-dragging)")];
  if (!container.contains(placeholder)) container.appendChild(placeholder);
  const target = items.reduce((acc, el) => {
    const box = el.getBoundingClientRect();
    const off = mouseY - box.top - box.height / 2;
    return off < 0 && off > acc.offset ? { offset: off, el } : acc;
  }, { offset: -Infinity, el: null }).el;
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

async function updateTaskState(id, state) {
  await fetch(`${BASE_URL}/tasks/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
}

async function fetchTasks() {
  const r = await fetch(`${BASE_URL}/tasks.json`);
  const data = await r.json();
  if (!data) return {};
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((t, i) => [i, t]).filter(([, t]) => t));
  }
  return data;
}

async function fetchSingleTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`);
  return (await r.json()) || {};
}

async function deleteTask(id) {
  await fetch(`${BASE_URL}/tasks/${id}.json`, { method: "DELETE" });
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
  return typeof x === "string" ? { text: x, done: false } : (x || { text: "", done: false });
}

async function saveSubtasks(taskId, subs) {
  await fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: subs }),
  });
}

async function renderAllTasks() {
  const tasks = await fetchTasks();
  clearColumns();
  Object.entries(tasks).forEach(([id, t]) => addTaskCard(id, t));
  updateAllEmptyStates();
}

function clearColumns() {
  document.querySelectorAll(".dropzone").forEach((z) => {
    const title = z.previousElementSibling?.textContent?.trim() || "";
    z.innerHTML = `<div class="empty">No tasks ${title}</div>`;
  });
}

function addTaskCard(id, t) {
  const zone = getZoneForTask(t);
  zone.querySelector(".empty")?.remove();

  const wrap = makeTaskWrapper(id);
  const { total, done, percent } = subtaskProgress(t.subtasks);

  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = id;
  card.innerHTML = taskCardInnerHtml(t, percent, done, total);

  bindCardClickDrag(wrap, card, id);
  wrap.appendChild(card);
  zone.appendChild(wrap);
}

function getZoneForTask(t) {
  const colId = STATE_TO_COL[t.state] || "todo";
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

async function openTaskDetail(id) {
  const overlay = byId("taskDetailOverlay");
  const content = byId("taskDetailContent");
  if (!overlay || !content) return;
  const task = await fetchSingleTask(id);
  content.innerHTML = taskDetailTemplate(id, task);
  wireDetailActions(overlay, content, id, task);
  showOverlay(overlay);
}

function wireDetailActions(overlay, content, id, task) {
  content.querySelectorAll('input[type="checkbox"][data-sub-index]').forEach((cb) => {
    cb.addEventListener("change", (e) => onSubtaskToggle(id, e));
  });
  byId("taskDetailClose")?.addEventListener("click", () => closeOverlay(overlay), { once: true });
  byId("taskDelete")?.addEventListener("click", () => onDeleteTask(id, overlay));
  byId("taskEdit")?.addEventListener("click", () => onEditTask(id, task, overlay));
  overlay.addEventListener("click", (e) => e.target === overlay && closeOverlay(overlay), { once: true });
  document.addEventListener("keydown", onEscCloseOnce);
}

function onSubtaskToggle(id, e) {
  const idx = parseInt(e.target.dataset.subIndex, 10);
  toggleSubtaskDone(id, idx, e.target.checked);
}

async function onDeleteTask(id, overlay) {
  if (!confirm("Delete this task?")) return;
  await deleteTask(id);
  closeOverlay(overlay);
  await renderAllTasks();
  updateAllEmptyStates();
}

function onEditTask(id, task, overlay) {
  closeOverlay(overlay);
  if (typeof openTaskOverlay === "function") {
    openTaskOverlay();
    typeof fillTaskFormFromExisting === "function" && fillTaskFormFromExisting(id, task);
  }
}

function showOverlay(overlay) {
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
}

function closeOverlay(overlay) {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", onEscCloseOnce);
}

function onEscCloseOnce(e) {
  if (e.key === "Escape") {
    const ov = byId("taskDetailOverlay");
    ov && closeOverlay(ov);
  }
}

function bindOverlayButtons() {
  byId("openAddTask")?.addEventListener("click", openTaskOverlay);
  document.querySelectorAll(".add-card-btn").forEach((b) => b.addEventListener("click", openTaskOverlay));
  byId("closeTaskOverlay")?.addEventListener("click", closeTaskOverlay);
  byId("cancelTask")?.addEventListener("click", closeTaskOverlay);
  byId("taskOverlay")?.addEventListener("click", (e) => e.target.id === "taskOverlay" && closeTaskOverlay());
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeTaskOverlay());
}

function openTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;
  ov.classList.add("open");
  document.body.classList.add("modal-open");
  initTaskFormEnhancements();
}

function closeTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;
  ov.classList.remove("open");
  document.body.classList.remove("modal-open");
  typeof clearTask === "function" && clearTask();
}

function initTaskFormEnhancements() {
  typeof initCategoryDropdown === "function" && initCategoryDropdown();
  typeof initContactsDropdown === "function" && initContactsDropdown();
  typeof initialiseSavePrioImg === "function" && initialiseSavePrioImg();
}

function byId(id) {
  return document.getElementById(id);
}
