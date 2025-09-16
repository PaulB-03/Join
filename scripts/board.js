const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";

const COL_TO_STATE = { todo: "toDo", "in-progress": "in progress", "await-feedback": "await feedback", done: "done" };
const STATE_TO_COL = Object.fromEntries(Object.entries(COL_TO_STATE).map(([c, s]) => [s, c]));

let dragged = null;
let placeholder = null;
let tasks = [];

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

    const formOverlay = byId("taskOverlay");
    formOverlay.classList.add("edit-mode");

    const addButton = byId("add");
    addButton.setAttribute("data-editing-id", id);
    addButton.querySelector("p").textContent = "Save changes";

    if (typeof fillTaskFormFromExisting === "function") {
      fillTaskFormFromExisting(id, task);
    }
  }
}

function fillTaskFormFromExisting(id, task) {
  byId("titleInput").value = task.title || "";
  byId("descriptionInput").value = task.description || "";
  byId("date").value = task.date || "";

  resetPrioSelection();
  if (task.priority) setPrioColor(task.priority);

  assignedContacts = task.assignedContacts ? [...task.assignedContacts] : [];
  renderAssignedInitials();

  fillSubtasks(task.subtasks || []);

  selectedCategory = task.category || "Task";
  selectedState = task.state || "toDo";
  assignedContacts = task.assignedContacts ? [...task.assignedContacts] : [];

  renderAssignedInitials();
  fillSubtasks(task.subtasks || []);
  setOverlayButtonText(true);
  toggleClearButton(true);
  byId("add").setAttribute("data-editing-id", id);
}

function resetPrioSelection() {
  document.querySelectorAll(".prioGrade").forEach(el => el.classList.remove("active"));
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
  byId("openAddTask")?.addEventListener("click", () => {
    clearTask();
    openTaskOverlay();
  });
  document.querySelectorAll(".add-card-btn").forEach((b) =>
    b.addEventListener("click", () => {
      clearTask();
      openTaskOverlay();
    })
  );
  byId("closeTaskOverlay")?.addEventListener("click", closeTaskOverlay);
  byId("cancelTask")?.addEventListener("click", closeTaskOverlay);
  byId("taskOverlay")?.addEventListener("click", (e) =>
    e.target.id === "taskOverlay" && closeTaskOverlay()
  );
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeTaskOverlay());
}

function openTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;

  ov.style.display = "flex";
  ov.classList.add("open");
  ov.classList.remove("edit-mode");

  document.body.classList.add("modal-open");

  const addButton = byId("add");
  addButton.removeAttribute("data-editing-id");
  addButton.querySelector("p").textContent = "Create task";
  clearTask();
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

const RTDB_BASE =
  (typeof baseURL !== "undefined" && baseURL) ||
  "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

async function saveSubtasksFromOverlay(taskId) {
  const items = Array.from(
    document.querySelectorAll("#taskDetailOverlay .subtasks__item")
  );

  const subtasks = items.map((el) => {
    const chk = el.querySelector('input[type="checkbox"]');
    const txt = (el.querySelector(".txt")?.textContent || "").trim();
    return { text: txt, done: !!chk?.checked };
  });

  const res = await fetch(`${RTDB_BASE}tasks/${taskId}/subtasks.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subtasks),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);

  const done = subtasks.filter((s) => s.done).length;
  return { done, total: subtasks.length };
}

function updateSubtaskCountersUI(taskId, done, total) {
  const overlay = document.getElementById("taskDetailOverlay");
  const counterInOverlay = overlay?.querySelector(".subtasks-counter");
  if (counterInOverlay) counterInOverlay.textContent = `${done}/${total} Subtasks`;

  const card = document.querySelector(`.card[data-id="${taskId}"]`) || null;
  if (card) {
    const meta = card.querySelector(".meta span");
    if (meta) meta.textContent = `${done}/${total} Subtasks`;
    const bar = card.querySelector(".progress .bar");
    if (bar && total > 0) bar.style.width = `${Math.round((done / total) * 100)}%`;
  }
}

document.addEventListener("change", async (e) => {
  const cb = e.target;
  if (!cb.matches('#taskDetailOverlay input[type="checkbox"][data-sub-index]')) return;

  const detail = cb.closest(".task-detail");
  const taskId = detail?.getAttribute("data-id");
  if (!taskId) return;

  const previous = !cb.checked;

  try {
    const { done, total } = await saveSubtasksFromOverlay(taskId);
    updateSubtaskCountersUI(taskId, done, total);
    document.dispatchEvent(new CustomEvent("task:updated", { detail: { taskId, done, total } }));
  } catch (err) {
    console.error(err);
    cb.checked = previous;
    alert("Konnte Subtask nicht speichern. Bitte später erneut versuchen.");
  }
});

function fillAssignedContacts(contacts) {
  const initialsWrapper = byId("assignedToInitials");
  initialsWrapper.innerHTML = "";
  if (contacts.length) {
    initialsWrapper.style.display = "flex";
    contacts.forEach(c => {
      const div = document.createElement("div");
      div.className = "av";
      div.style.background = color(contacts.indexOf(c));
      div.textContent = initials(c);
      initialsWrapper.appendChild(div);
    });
  } else {
    initialsWrapper.style.display = "none";
  }
}

function fillSubtasks(subtasks) {
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  wrapper.innerHTML = "";
  subtasks.forEach((s, i) => {
    const txt = typeof s === "string" ? s : s.text;
    const done = typeof s === "object" ? !!s.done : false;
    const div = document.createElement("div");
    div.className = "subtask";
    div.innerHTML = `
      <input type="checkbox" ${done ? "checked" : ""} disabled />
      <span>${escapeHtml(txt)}</span>
    `;
    wrapper.appendChild(div);
  });
}

async function updateTask(id) {
  if (!id) {
    if (typeof window.createTask === "function") {
      window.createTask();
    }
    return;
  }

  const updatedTask = {
    title: byId("titleInput").value.trim(),
    description: byId("descriptionInput").value.trim(),
    date: byId("date").value,
    priority: selectedPrio,
    assignedContacts: assignedContacts,
    subtasks: getSubtasksFromForm(),
    state: selectedState,
    category: selectedCategory
  };

  try {
    await fetch(`${RTDB_BASE}tasks/${id}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask)
    });

    closeOverlay(document.querySelector(".overlay"));
    await renderAllTasks();

  } catch (err) {
    console.error("Error updating task:", err);
    alert("Failed to update task. Please try again.");
  }
}

function renderUpdatedTask(id, task) {
  const oldCard = document.querySelector(`.task-card[data-id="${id}"]`);
  if (oldCard) oldCard.remove();
  const columnId = task.state === "toDo" ? "todo"
                 : task.state === "inProgress" ? "inprogress"
                 : "done";
  const column = document.getElementById(columnId);
  if (!column) return;

  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.id = id;
  card.innerHTML = `
    <h3>${escapeHtml(task.title)}</h3>
    <p>${escapeHtml(task.description)}</p>
    <small>${task.date}</small>
  `;
  column.appendChild(card);
}

function renderAssignedInitials() {
  const wrapper = document.getElementById("assignedToInitials");
  wrapper.innerHTML = "";
  if (assignedContacts.length > 0) {
    wrapper.style.display = "flex";
    assignedContacts.forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "av";
      div.style.background = color(i);
      div.textContent = initials(c);
      wrapper.appendChild(div);
    });
  } else {
    wrapper.style.display = "none";
  }
}

function setOverlayButtonText(isEditing) {
  const btn = byId("add");
  if (!btn) return;
  btn.textContent = "";

  const text = document.createElement("p");
  text.textContent = isEditing ? "OK" : "Create";

  const img = document.createElement("img");
  img.src = isEditing ? "../assets/svg/check.svg" : "../assets/svg/check.svg";
  img.className = isEditing ? "createTaskCheck" : "createTaskCheck";
  img.alt = "";

  btn.appendChild(text);
  btn.appendChild(img);
}

function toggleClearButton(isEditing) {
  const clearBtn = byId("clear");
  if (!clearBtn) return;
  clearBtn.style.display = isEditing ? "none" : "inline-flex";
}

byId("openAddTask")?.addEventListener("click", () => {
  clearTask();
  openTaskOverlay();
  setOverlayButtonText(false);
  toggleClearButton(false);
});

async function handleAddOrEditTask(event) {
  if (event) event.preventDefault();
  const addButton = byId("add");
  const editingId = addButton.getAttribute("data-editing-id");

  if (editingId) {
    await updateTask(editingId);

    addButton.removeAttribute("data-editing-id");
    addButton.querySelector("p").textContent = "Create task";
    byId("taskOverlay").classList.remove("edit-mode");
  } else {
    await createTask();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.addEventListener('click', () => {
    if (typeof dateInput.showPicker === 'function') {
      dateInput.showPicker();
    }
  });
});