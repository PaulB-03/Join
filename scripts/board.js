/**
 * Base URL to Firebase Realtime Database (no trailing slash in requests).
 * @type {string}
 */
const BASE_URL = DB_ROOT;

/**
 * Kanban column -> task state mapping.
 * @type {{[key:string]: "toDo"|"in progress"|"await feedback"|"done"}}
 */
const COL_TO_STATE = {
  todo: "toDo",
  "in-progress": "in progress",
  "await-feedback": "await feedback",
  done: "done",
};

/**
 * Reverse map (task state -> kanban column id).
 * @type {{[key in "toDo"|"in progress"|"await feedback"|"done"]: string}}
 */
const STATE_TO_COL = Object.fromEntries(Object.entries(COL_TO_STATE).map(([c, s]) => [s, c]));

/** Avoid double-binding live listeners. */
let __liveBound = false;
/** RTDB ref to "tasks". */
let __tasksRef = null;
/** Mark local edits to ignore echo updates from RTDB. */
const __localEdits = new Set();

/**
 * Entry point: init board, overlay buttons, subtask listener.
 */
document.addEventListener("DOMContentLoaded", () => {
  init();
  bindOverlayButtons();
  setupOverlayResponsiveRedirect();
  mountSubtaskCheckboxListener();
});

/**
 * Main init: render, live sync, DnD, highlight, etc.
 * @returns {Promise<void>}
 */
async function init() {
  try {
    await renderAllTasks();
  } catch (e) {
    console.error("Initial render failed:", e);
    clearColumns(); // shows empty states instead of blank page
  }
  startLiveSync();
  initDnd();
  highlightNewTask();
  checkSwapMenu();
}

/**
 * RTDB: update a task's state (with local-edit mark).
 * @param {string} id
 * @param {"toDo"|"in progress"|"await feedback"|"done"} state
 * @returns {Promise<void>}
 */
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

/**
 * Fetch all tasks; normalize array-form to object.
 * @returns {Promise<Record<string, any>>}
 */
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

/**
 * Fetch a single task by ID.
 * @param {string} id
 * @returns {Promise<any>}
 */
async function fetchSingleTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`);
  if (!r.ok) throw new Error(`GET task ${id} failed: ${r.status}`);
  return (await r.json()) || {};
}

/**
 * Delete a task by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function deleteTask(id) {
  const r = await fetch(`${BASE_URL}/tasks/${id}.json`, { method: "DELETE" });
  if (!r.ok) throw new Error(`DELETE task ${id} failed: ${r.status}`);
}

/**
 * Toggle subtask checkbox and persist changes.
 * @param {string} taskId
 * @param {number} index
 * @param {boolean} done
 * @returns {Promise<void>}
 */
async function toggleSubtaskDone(taskId, index, done) {
  const t = await fetchSingleTask(taskId);
  const subs = normalizeSubtasks(t.subtasks);
  if (subs[index] == null) return;
  subs[index] = toSubtask(subs[index]);
  subs[index].done = !!done;
  await saveSubtasks(taskId, subs);
}

/**
 * Normalize subtasks into an array.
 * @param {any} subs
 * @returns {Array<any>}
 */
function normalizeSubtasks(subs) {
  return Array.isArray(subs) ? subs : [];
}

/**
 * Ensure subtask is an object {text, done}.
 * @param {any} x
 * @returns {{text:string, done:boolean}}
 */
function toSubtask(x) {
  return typeof x === "string" ? { text: x, done: false } : x || { text: "", done: false };
}

/**
 * Save full subtasks array via PATCH.
 * @param {string} taskId
 * @param {Array<any>} subs
 * @returns {Promise<void>}
 */
async function saveSubtasks(taskId, subs) {
  const r = await fetch(`${BASE_URL}/tasks/${taskId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks: subs }),
  });
  if (!r.ok) throw new Error(`PATCH subtasks failed: ${r.status}`);
}

/**
 * Rebuild board: clear, render all cards, update empties.
 * @returns {Promise<void>}
 */
async function renderAllTasks() {
  const tasks = await fetchTasks();
  clearColumns();
  Object.entries(tasks).forEach(([id, t]) => addTaskCard(id, t));
  updateAllEmptyStates();
}

/**
 * Compute card HTML via shared template function.
 * @param {any} t - task object
 * @returns {string} innerHTML for the card
 */
function computeCardHTML(t) {
  const { total, done, percent } = subtaskProgress(t.subtasks);
  return window.taskCardInnerHtml(t, percent, done, total);
}

/**
 * Insert a card into the proper column.
 * @param {string} id
 * @param {any} t
 * @returns {void}
 */
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

/**
 * Resolve correct dropzone element from task state.
 * @param {{state?: string}} t
 * @returns {HTMLElement}
 */
function getZoneForTask(t) {
  const colId = STATE_TO_COL[t?.state] || "todo";
  return document.getElementById(colId);
}

/**
 * Create DnD wrapper for a card.
 * @param {string} id
 * @returns {HTMLDivElement}
 */
function makeTaskWrapper(id) {
  const w = document.createElement("div");
  w.className = "task-container";
  w.dataset.id = id;
  w.draggable = true;
  return w;
}

/**
 * Calculate subtask progress metrics.
 * @param {Array<any>} subs
 * @returns {{total:number, done:number, percent:number}}
 */
function subtaskProgress(subs) {
  const list = Array.isArray(subs) ? subs : [];
  const total = list.length;
  const done = list.reduce((n, s) => n + (typeof s === "object" && s?.done ? 1 : 0), 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

/**
 * Bind click (open detail) and drag flags to a card.
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} card
 * @param {string} id
 * @returns {void}
 */
function bindCardClickDrag(wrapper, card, id) {
  let draggedFlag = false;
  wrapper.addEventListener("dragstart", () => (draggedFlag = true));
  wrapper.addEventListener("dragend", () => setTimeout(() => (draggedFlag = false), 0));
  card.addEventListener("click", () => !draggedFlag && openTaskDetail(id));
}

/**
 * Start live sync from RTDB (guarded once).
 * @returns {void}
 */
function startLiveSync() {
  if (__liveBound) return;
  if (!window.rtdb) {
    console.warn("RTDB not initialized – skipping live sync.");
    return;
  }
  __liveBound = true;
  __tasksRef = window.rtdb.ref("tasks");
  bindLiveHandlers(__tasksRef);
}

/**
 * Bind RTDB event handlers for tasks.
 * @param {any} ref - RTDB ref
 * @returns {void}
 */
function bindLiveHandlers(ref) {
  ref.on("child_added", onChildAdded);
  ref.on("child_changed", onChildChanged);
  ref.on("child_removed", onChildRemoved);
}

/**
 * RTDB: task added → insert card.
 * @param {{key:string,val:()=>any}} snap
 * @returns {void}
 */
function onChildAdded(snap) {
  upsertTaskCard(snap.key, snap.val());
  updateAllEmptyStates();
}

/**
 * RTDB: task changed → update/move card.
 * @param {{key:string,val:()=>any}} snap
 * @returns {void}
 */
function onChildChanged(snap) {
  const id = snap.key,
    t = snap.val();
  if (__localEdits.has(id)) {
    safeUpdateCardContent(id, t);
    return;
  }
  handleChangedPlacement(id, t);
}

/**
 * Move card if column changed; otherwise update content.
 * @param {string} id
 * @param {any} t
 * @returns {void}
 */
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

/**
 * RTDB: task removed → delete card.
 * @param {{key:string}} snap
 * @returns {void}
 */
function onChildRemoved(snap) {
  removeTaskCard(snap.key);
  updateAllEmptyStates();
}

/**
 * Safely replace card HTML (or recreate if missing).
 * @param {string} id
 * @param {any} t
 * @returns {void}
 */
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

/**
 * Create/update card and place it in the proper column.
 * @param {string} id
 * @param {any} t
 * @returns {void}
 */
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

/**
 * Fully remove a card element by id.
 * @param {string} id
 * @returns {void}
 */
function removeTaskCard(id) {
  document.querySelector(`.task-container[data-id="${id}"]`)?.remove();
}

/**
 * Unsubscribe RTDB listeners on page unload.
 */
window.addEventListener("beforeunload", () => {
  try {
    __tasksRef?.off();
  } catch (e) {}
});

/**
 * Public API exposure for other modules.
 */
window.Board = Object.assign(window.Board || {}, {
  renderAllTasks,
  fetchTasks,
  fetchSingleTask,
  deleteTask,
  toggleSubtaskDone,
});
