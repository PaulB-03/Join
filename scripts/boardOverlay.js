/**
 * Shorthand for document.getElementById().
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function byId(id) {
  return document.getElementById(id);
}

(function () {
  /**
   * Fallback-Farbpalette, falls window.color fehlt.
   * @returns {void}
   */
  if (typeof window.color !== "function") {
    const __PALETTE = ["#f44336", "#2196F3", "#FF9800", "#9C27B0", "#4CAF50", "#00BCD4", "#FFC107"];
    window.color = (i) => __PALETTE[i % __PALETTE.length];
  }
})();

/** @type {Record<string,string>} */
const __COL_TO_STATE = { "todo": "toDo", "in-progress": "in progress", "await-feedback": "await feedback", "done": "done" };
/** @type {string} Firebase RTDB Base URL */
const RTDB_BASE = (typeof baseURL !== "undefined" && baseURL) || "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";
/** @type {HTMLElement|null} remembers last focused element before overlay */
let __lastActive = null;

/* -------------------------- Overlay-Utilities -------------------------- */

/**
 * First focusable element inside root.
 * @param {ParentNode} [root=document]
 * @returns {HTMLElement|null}
 */
function firstFocusable(root = document) {
  return root.querySelector('[autofocus],button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
}

/**
 * Returns main layout parts that should be inert behind overlays.
 * @returns {HTMLElement[]}
 */
function inertParts() {
  return [document.querySelector("header"), byId("sidebar"), document.querySelector(".app")].filter(Boolean);
}

/**
 * Toggles aria-hidden/inert on background parts.
 * @param {boolean} on
 * @returns {void}
 */
function setBackgroundInert(on) {
  inertParts().forEach((el) => {
    if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
    else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
  });
}

/**
 * Applies open semantics/styling to overlay.
 * @param {HTMLElement} overlay
 * @returns {void}
 */
function openSemantics(overlay) {
  __lastActive = document.activeElement;
  overlay.style.display = "flex";
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  // setBackgroundInert(true);
}

/**
 * Removes open semantics/styling from overlay.
 * @param {HTMLElement} overlay
 * @returns {void}
 */
function closeSemantics(overlay) {
  overlay.classList.remove("open");
  overlay.style.display = "";
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

/**
 * Shows overlay and optionally focuses first focusable.
 * @param {HTMLElement} overlay
 * @param {{focus?:boolean}} [opts]
 * @returns {void}
 */
function showOverlay(overlay, { focus = true } = {}) {
  openSemantics(overlay);
  if (!focus) return;
  const t = firstFocusable(overlay) || overlay;
  setTimeout(() => t?.focus?.(), 0);
}

/**
 * Closes overlay and restores previous focus.
 * @param {HTMLElement} overlay
 * @returns {void}
 */
function closeOverlay(overlay) {
  if (!overlay) return;
  document.removeEventListener("keydown", onEscCloseOnce);
  if (overlay.contains(document.activeElement)) document.activeElement.blur();
  const next = __lastActive && document.contains(__lastActive) ? __lastActive : document.body;
  try { next?.focus?.(); } catch {}
  __lastActive = null;
  closeSemantics(overlay);
}

/**
 * ESC handler to close topmost open overlay.
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function onEscCloseOnce(e) {
  if (e.key !== "Escape") return;
  const d = byId("taskDetailOverlay"), a = byId("taskOverlay");
  if (d?.classList.contains("open")) return closeOverlay(d);
  if (a?.classList.contains("open")) return closeOverlay(a);
}

/* ---------------------------- Detail-Overlay ---------------------------- */

/**
 * Opens the task detail overlay and wires actions.
 * @param {string} id - Task ID
 * @returns {Promise<void>}
 */
async function openTaskDetail(id) {
  const ov = byId("taskDetailOverlay"), ct = byId("taskDetailContent");
  if (!ov || !ct) return;
  showOverlay(ov, { focus: false });
  const task = await window.Board?.fetchSingleTask?.(id);
  ct.innerHTML = (window.taskDetailTemplate || taskDetailTemplate)(id, task);
  wireDetailActions(ov, ct, id, task);
  (firstFocusable(ov) || ov).focus();
}

/**
 * Binds detail overlay actions: subtasks, close, delete, edit, esc.
 * @param {HTMLElement} overlay
 * @param {HTMLElement} content
 * @param {string} id
 * @param {Object} task
 * @returns {void}
 */
function wireDetailActions(overlay, content, id, task) {
  content.querySelectorAll('input[type="checkbox"][data-sub-index]').forEach((cb) =>
    cb.addEventListener("change", (e) => onSubtaskToggle(id, e))
  );
  byId("taskDetailClose")?.addEventListener("click", () => closeOverlay(overlay), { once: true });
  byId("taskDelete")?.addEventListener("click", () => onDeleteTask(id, overlay));
  byId("taskEdit")?.addEventListener("click", () => onEditTask(id, task, overlay));
  overlay.addEventListener("click", (e) => e.target === overlay && closeOverlay(overlay), { once: true });
  document.addEventListener("keydown", onEscCloseOnce);
}

/**
 * Handles a subtask checkbox toggle from detail overlay.
 * @param {string} id
 * @param {Event} e
 * @returns {void}
 */
function onSubtaskToggle(id, e) {
  const idx = parseInt(e.target.dataset.subIndex, 10);
  window.Board?.toggleSubtaskDone?.(id, idx, e.target.checked);
}

/**
 * Deletes task, closes overlay, refreshes board.
 * @param {string} id
 * @param {HTMLElement} overlay
 * @returns {Promise<void>}
 */
async function onDeleteTask(id, overlay) {
  // if (!confirm("Delete this task?")) return;
  await window.Board?.deleteTask?.(id);
  closeOverlay(overlay);
  await window.Board?.renderAllTasks?.();
  window.Board?.updateAllEmptyStates?.();
}

/* ----------------------------- Add/Edit-UI ------------------------------ */

/**
 * Enters edit mode: closes detail, opens add/edit, fills data.
 * @param {string} id
 * @param {Object} task
 * @param {HTMLElement} overlay
 * @returns {void}
 */
function onEditTask(id, task, overlay) {
  closeOverlay(overlay);
  if (typeof openTaskOverlay !== "function") return;
  openTaskOverlay();
  byId("taskOverlay")?.classList.add("edit-mode");
  fillTaskFormFromExisting?.(id, task);
}

/**
 * Binds overlay open/close buttons & ESC close.
 * @returns {void}
 */
function bindOverlayButtons() {
  byId("openAddTask")?.addEventListener("click", onOpenAddClick);
  document.querySelectorAll(".add-card-btn").forEach((b) => b.addEventListener("click", onQuickAddClick));
  byId("closeTaskOverlay")?.addEventListener("click", hideTaskOverlay);
  byId("cancelTask")?.addEventListener("click", hideTaskOverlay);
  byId("taskOverlay")?.addEventListener("click", (e) => e.target.id === "taskOverlay" && hideTaskOverlay());
  document.addEventListener("keydown", (e) => e.key === "Escape" && hideTaskOverlay());
}

/**
 * Hides add/edit overlay and clears the form.
 * @returns {void}
 */
function hideTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;
  closeOverlay(ov);
  typeof clearTask === "function" && clearTask();
}

/**
 * Opens add overlay (mobile navigates) and clears form.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onOpenAddClick(e) {
  e.preventDefault();
  if (window.innerWidth <= 850) return location.assign("../html/addTask.html");
  clearTask();
  openTaskOverlay();
}

/**
 * Quick-add from column: preselects state and opens overlay.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onQuickAddClick(e) {
  const zone = e?.currentTarget?.parentElement?.nextElementSibling;
  const colId = zone && zone.classList.contains("dropzone") ? zone.id : "todo";
  window.selectedState = __COL_TO_STATE[colId] || "toDo";
  clearTask();
  openTaskOverlay();
}

/**
 * Shows the add/edit overlay and initializes form.
 * @returns {void}
 */
function openTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;
  ov.classList.remove("edit-mode");
  showOverlay(ov, { focus: false });
  byId("add")?.removeAttribute("data-editing-id");
  setOverlayButtonText(false);
  toggleClearButton(false);
  clearTask();
  initTaskFormEnhancements();
  (byId("titleInput") || firstFocusable(ov) || ov).focus();
}

/**
 * Initializes form enhancements (dropdowns, prio images).
 * @returns {void}
 */
function initTaskFormEnhancements() {
  typeof initCategoryDropdown === "function" && initCategoryDropdown();
  typeof initContactsDropdown === "function" && initContactsDropdown();
  typeof initialiseSavePrioImg === "function" && initialiseSavePrioImg();
}

/**
 * Fills the add/edit form with an existing task.
 * @param {string} id
 * @param {Object} task
 * @returns {void}
 */
function fillTaskFormFromExisting(id, task) {
  setFormValues(task);
  setPrioFromTask(task);
  assignedContacts = task.assignedContacts ? [...task.assignedContacts] : [];
  renderAssignedInitials();
  fillSubtasks(task.subtasks || []);
  selectedCategory = task.category || "Task";
  selectedState = task.state || "toDo";
  setOverlayButtonText(true);
  toggleClearButton(true);
  byId("add").setAttribute("data-editing-id", id);
}

/**
 * Writes title/description/date into the form fields.
 * @param {{title?:string,description?:string,date?:string}} task
 * @returns {void}
 */
function setFormValues(task) {
  byId("titleInput").value = task.title || "";
  byId("descriptionInput").value = task.description || "";
  byId("date").value = task.date || "";
}

/**
 * Applies priority selection from given task.
 * @param {{priority?:string}} task
 * @returns {void}
 */
function setPrioFromTask(task) {
  resetPrioSelection();
  if (task.priority) setPrioColor(task.priority);
}

/**
 * Clears any selected priority CSS state.
 * @returns {void}
 */
function resetPrioSelection() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("active"));
}

/**
 * Updates text/icon of the submit button depending on mode.
 * @param {boolean} isEditing
 * @returns {void}
 */
function setOverlayButtonText(isEditing) {
  const btn = byId("add");
  if (!btn) return;
  btn.textContent = "";
  const p = document.createElement("p");
  p.textContent = isEditing ? "Ok" : "Create Task";
  const img = document.createElement("img");
  img.src = "../assets/svg/check.svg";
  img.className = "createTaskCheck";
  img.alt = "";
  btn.append(p, img);
}

/**
 * Shows/hides the "Clear" button based on edit mode.
 * @param {boolean} isEditing
 * @returns {void}
 */
function toggleClearButton(isEditing) {
  const c = byId("clear");
  if (!c) return;
  c.style.display = isEditing ? "none" : "inline-flex";
}

/* ----------------------------- Add / Edit ------------------------------- */

/**
 * Handles form submit: create or update task.
 * @param {Event} [e]
 * @returns {Promise<void>}
 */
async function handleAddOrEditTask(e) {
  e && e.preventDefault();
  const id = byId("add")?.getAttribute("data-editing-id");
  if (!id) {
    return typeof window.createTask === "function"
      ? window.createTask()
      : console.error("createTask not found");
  }
  await saveEditFlow(id);
}

/**
 * Saves the edited task and manages UI flow.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function saveEditFlow(id) {
  const standalone = /\/html\/addTask\.html$/.test(location.pathname);
  const reopen = !standalone;
  await updateTask(id, standalone, true, reopen);
  byId("add")?.removeAttribute("data-editing-id");
  setOverlayButtonText(false);
  byId("taskOverlay")?.classList.remove("edit-mode");
}

/**
 * Reads task data from the form into an object.
 * @returns {{title:string,description:string,date:string,priority:any,assignedContacts:any,subtasks:any,state:string,category:string}}
 */
function readTaskForm() {
  return {
    title: byId("titleInput").value.trim(),
    description: byId("descriptionInput").value.trim(),
    date: byId("date").value,
    priority: selectedPrio,
    assignedContacts,
    subtasks: getSubtasksFromForm(),
    state: selectedState,
    category: selectedCategory,
  };
}

/**
 * PUTs the full task JSON to RTDB at /tasks/:id.
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<void>}
 */
async function putTaskJson(id, data) {
  const r = await fetch(`${RTDB_BASE}tasks/${id}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("PUT failed: " + r.status);
}

/**
 * Post-update UI flow (close, rerender, navigate, reopen detail).
 * @param {string} id
 * @param {boolean} navigateToBoard
 * @param {boolean} closeOverlayAfter
 * @param {boolean} reopenDetail
 * @returns {Promise<void>}
 */
async function afterUpdateUI(id, navigateToBoard, closeOverlayAfter, reopenDetail) {
  if (closeOverlayAfter) closeOverlay(byId("taskOverlay"));
  await window.Board?.renderAllTasks?.();
  if (navigateToBoard) { location.href = "board.html"; return; }
  if (reopenDetail) await openTaskDetail(id);
}

/**
 * Updates task in RTDB and coordinates UI changes.
 * @param {string} id
 * @param {boolean} [navigateToBoard=false]
 * @param {boolean} [closeTaskOverlayAfterUpdate=false]
 * @param {boolean} [reopenDetail=false]
 * @returns {Promise<void|null>}
 */
async function updateTask(id, navigateToBoard = false, closeTaskOverlayAfterUpdate = false, reopenDetail = false) {
  if (!id) return typeof window.createTask === "function" ? window.createTask() : null;
  try {
    await putTaskJson(id, readTaskForm());
    await afterUpdateUI(id, navigateToBoard, closeTaskOverlayAfterUpdate, reopenDetail);
  } catch (err) {
    console.error("Error updating task:", err);
    alert("Failed to update task. Please try again.");
  }
}

/* ------------------------- Subtasks im Detail-UI ------------------------- */

/**
 * Reads subtasks from detail overlay and saves them.
 * @param {string} taskId
 * @returns {Promise<{done:number,total:number}>}
 */
async function saveSubtasksFromOverlay(taskId) {
  const items = [...document.querySelectorAll("#taskDetailOverlay .subtasks__item")];
  const subs = items.map((el) => {
    const chk = el.querySelector('input[type="checkbox"]');
    const txt = (el.querySelector(".txt")?.textContent || "").trim();
    return { text: txt, done: !!chk?.checked };
  });
  const res = await fetch(`${RTDB_BASE}tasks/${taskId}/subtasks.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subs),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return { done: subs.filter((s) => s.done).length, total: subs.length };
}

/**
 * Updates subtask counters in detail overlay and on the card.
 * @param {string} taskId
 * @param {number} done
 * @param {number} total
 * @returns {void}
 */
function updateSubtaskCountersUI(taskId, done, total) {
  const ov = byId("taskDetailOverlay"), c = ov?.querySelector(".subtasks-counter");
  if (c) c.textContent = `${done}/${total} Subtasks`;
  const card = document.querySelector(`.card[data-id="${taskId}"]`) || null;
  if (!card) return;
  const meta = card.querySelector(".meta span");
  if (meta) meta.textContent = `${done}/${total} Subtasks`;
  const bar = card.querySelector(".progress .bar");
  if (bar && total > 0) bar.style.width = `${Math.round((done / total) * 100)}%`;
}

/**
 * Mounts a delegated change listener for subtask checkboxes.
 * @returns {void}
 */
function mountSubtaskCheckboxListener() {
  document.addEventListener("change", onDetailSubtaskChange);
}

/**
 * Handles subtask change events and persists them.
 * @param {Event} e
 * @returns {Promise<void>}
 */
async function onDetailSubtaskChange(e) {
  const cb = e.target;
  if (!cb.matches('#taskDetailOverlay input[type="checkbox"][data-sub-index]')) return;
  const detail = cb.closest(".task-detail"), taskId = detail?.getAttribute("data-id");
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
}

/* ----------------------- Assigned / Subtasks (Form) ---------------------- */

/**
 * Renders avatar initials for assigned contacts in the form.
 * @param {string[]} contacts
 * @returns {void}
 */
function fillAssignedContacts(contacts) {
  const wrap = byId("assignedToInitials");
  wrap.innerHTML = "";
  if (!contacts?.length) { wrap.style.display = "none"; return; }
  wrap.style.display = "flex";
  contacts.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "av";
    div.style.background = window.color(i);
    div.textContent = initials(c);
    wrap.appendChild(div);
  });
}

/**
 * Renders existing subtasks into the add/edit overlay list.
 * @param {Array<string|{text:string,done?:boolean}>} subtasks
 * @returns {void}
 */
function fillSubtasks(subtasks) {
  const wrap = document.querySelector(".addedSubtaskWrapper");
  wrap.innerHTML = "";
  (subtasks || []).forEach((s) => {
    let txt = typeof s === "string" ? s : s.text;
    txt = txt.replace(/^•\s*/, "");
    wrap.appendChild(createSubtaskElement(txt, !!(typeof s === "object" && s.done)));
  });
}

/**
 * Renders initials for globally selected assignedContacts.
 * @returns {void}
 */
function renderAssignedInitials() {
  const w = byId("assignedToInitials");
  w.innerHTML = "";
  if (!(assignedContacts && assignedContacts.length)) { w.style.display = "none"; return; }
  w.style.display = "flex";
  assignedContacts.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "av";
    d.style.background = window.color(i);
    d.textContent = initials(c);
    w.appendChild(d);
  });
}

/* --------------------------- Datepicker (Min) ---------------------------- */

/**
 * Sets min date to today and tries to open native picker.
 * @returns {void}
 */
function mountDatePickerMinToday() {
  const input = byId("date");
  if (!input) return;
  input.min = new Date().toISOString().split("T")[0];
  const tryOpen = () => {
    try {
      const ua = navigator.userActivation;
      const ok = ua && (ua.isActive || ua.hasBeenActive);
      if (typeof input.showPicker === "function" && ok) input.showPicker();
    } catch {}
  };
  input.addEventListener("pointerdown", tryOpen);
}
