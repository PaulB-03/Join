function byId(id) {
  return document.getElementById(id);
}

(function () {
  if (typeof window.color !== "function") {
    const __PALETTE = ["#f44336", "#2196F3", "#FF9800", "#9C27B0", "#4CAF50", "#00BCD4", "#FFC107"];
    window.color = function (i) {
      return __PALETTE[i % __PALETTE.length];
    };
  }
})();

const __COL_TO_STATE = {
  "todo": "toDo",
  "in-progress": "in progress",
  "await-feedback": "await feedback",
  "done": "done",
};

const RTDB_BASE = (typeof baseURL !== "undefined" && baseURL) || "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

let __lastActive = null;

/* -------------------------- Overlay-Utilities -------------------------- */

function firstFocusable(root = document) {
  return root.querySelector('[autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
}

function inertParts() {
  return [document.querySelector("header"), byId("sidebar"), document.querySelector(".app")].filter(Boolean);
}

function setBackgroundInert(on) {
  inertParts().forEach((el) => {
    if (on) {
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
    } else {
      el.removeAttribute("inert");
      el.removeAttribute("aria-hidden");
    }
  });
}

function openSemantics(overlay) {
  __lastActive = document.activeElement;
  overlay.style.display = "flex";
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  //setBackgroundInert(true);
}

function closeSemantics(overlay) {
  overlay.classList.remove("open");
  overlay.style.display = "";
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  //setBackgroundInert(false);
}

function showOverlay(overlay, { focus = true } = {}) {
  openSemantics(overlay);
  if (!focus) return;
  const t = firstFocusable(overlay) || overlay;
  setTimeout(() => t?.focus?.(), 0);
}

function closeOverlay(overlay) {
  if (!overlay) return;
  closeSemantics(overlay);
  document.removeEventListener("keydown", onEscCloseOnce);
  __lastActive?.focus?.();
  __lastActive = null;
}

function onEscCloseOnce(e) {
  if (e.key !== "Escape") return;
  const d = byId("taskDetailOverlay"),
    a = byId("taskOverlay");
  if (d?.classList.contains("open")) return closeOverlay(d);
  if (a?.classList.contains("open")) return closeOverlay(a);
}

/* ---------------------------- Detail-Overlay ---------------------------- */

async function openTaskDetail(id) {
  const ov = byId("taskDetailOverlay"),
    ct = byId("taskDetailContent");
  if (!ov || !ct) return;
  showOverlay(ov, { focus: false });
  const task = await window.Board?.fetchSingleTask?.(id);
  ct.innerHTML = (window.taskDetailTemplate || taskDetailTemplate)(id, task);
  wireDetailActions(ov, ct, id, task);
  (firstFocusable(ov) || ov).focus();
}

function wireDetailActions(overlay, content, id, task) {
  content.querySelectorAll('input[type="checkbox"][data-sub-index]').forEach((cb) => cb.addEventListener("change", (e) => onSubtaskToggle(id, e)));
  byId("taskDetailClose")?.addEventListener("click", () => closeOverlay(overlay), { once: true });
  byId("taskDelete")?.addEventListener("click", () => onDeleteTask(id, overlay));
  byId("taskEdit")?.addEventListener("click", () => onEditTask(id, task, overlay));
  overlay.addEventListener("click", (e) => e.target === overlay && closeOverlay(overlay), { once: true });
  document.addEventListener("keydown", onEscCloseOnce);
}

function onSubtaskToggle(id, e) {
  const idx = parseInt(e.target.dataset.subIndex, 10);
  window.Board?.toggleSubtaskDone?.(id, idx, e.target.checked);
}

async function onDeleteTask(id, overlay) {
  if (!confirm("Delete this task?")) return;
  await window.Board?.deleteTask?.(id);
  closeOverlay(overlay);
  await window.Board?.renderAllTasks?.();
  window.Board?.updateAllEmptyStates?.();
}

/* ----------------------------- Add/Edit-UI ------------------------------ */

function onEditTask(id, task, overlay) {
  closeOverlay(overlay);
  if (typeof openTaskOverlay !== "function") return;
  openTaskOverlay();
  byId("taskOverlay")?.classList.add("edit-mode");
  const btn = byId("add");
  if (btn) {
    btn.setAttribute("data-editing-id", id);
    // Falls kein <p> vorhanden ist, anlegen
    let p = btn.querySelector("p");
    if (!p) {
      p = document.createElement("p");
      btn.prepend(p);
    }
    p.textContent = "Save changes";
  }
  typeof fillTaskFormFromExisting === "function" && fillTaskFormFromExisting(id, task);
}

function bindOverlayButtons() {
  byId("openAddTask")?.addEventListener("click", onOpenAddClick);
  document.querySelectorAll(".add-card-btn").forEach((b) => b.addEventListener("click", onQuickAddClick));
  byId("closeTaskOverlay")?.addEventListener("click", closeTaskOverlay);
  byId("cancelTask")?.addEventListener("click", closeTaskOverlay);
  byId("taskOverlay")?.addEventListener("click", (e) => e.target.id === "taskOverlay" && closeTaskOverlay());
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeTaskOverlay());
}

function onOpenAddClick(e) {
  e.preventDefault();
  if (window.innerWidth <= 850) return location.assign("../html/addTask.html");
  clearTask();
  openTaskOverlay();
  setOverlayButtonText(false);
  toggleClearButton(false);
}

function onQuickAddClick(e) {
  const zone = e?.currentTarget?.parentElement?.nextElementSibling;
  const colId = zone && zone.classList.contains("dropzone") ? zone.id : "todo";
  window.selectedState = __COL_TO_STATE[colId] || "toDo";
  clearTask();
  openTaskOverlay();
}

function openTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;
  ov.classList.remove("edit-mode");
  showOverlay(ov, { focus: false });
  const btn = byId("add");
  if (btn) {
    btn.removeAttribute("data-editing-id");
    // Stelle sicher, dass ein <p> existiert bevor textContent gesetzt wird
    let p = btn.querySelector("p");
    if (!p) {
      p = document.createElement("p");
      btn.prepend(p);
    }
    p.textContent = "Create task";
  }
  clearTask();
  initTaskFormEnhancements();
  (byId("titleInput") || firstFocusable(ov) || ov).focus();
}

function closeTaskOverlay() {
  const ov = byId("taskOverlay");
  if (!ov) return;
  closeOverlay(ov);
  typeof clearTask === "function" && clearTask();
}

function initTaskFormEnhancements() {
  typeof initCategoryDropdown === "function" && initCategoryDropdown();
  typeof initContactsDropdown === "function" && initContactsDropdown();
  typeof initialiseSavePrioImg === "function" && initialiseSavePrioImg();
}

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

function setFormValues(task) {
  byId("titleInput").value = task.title || "";
  byId("descriptionInput").value = task.description || "";
  byId("date").value = task.date || "";
}

function setPrioFromTask(task) {
  resetPrioSelection();
  if (task.priority) setPrioColor(task.priority);
}

function resetPrioSelection() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("active"));
}

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

function toggleClearButton(isEditing) {
  const c = byId("clear");
  if (!c) return;
  c.style.display = isEditing ? "none" : "inline-flex";
}

/* ----------------------------- Add / Edit ------------------------------- */

async function handleAddOrEditTask(e) {
  e && e.preventDefault();
  const id = byId("add")?.getAttribute("data-editing-id");
  if (!id) return typeof window.createTask === "function" ? window.createTask() : console.error("createTask not found");
  await saveEditFlow(id);
}

async function saveEditFlow(id) {
  const standalone = /\/html\/addTask\.html$/.test(location.pathname);
  const reopen = !standalone;
  await updateTask(id, standalone, true, reopen);
  byId("add")?.removeAttribute("data-editing-id");
  setOverlayButtonText(false);
  byId("taskOverlay")?.classList.remove("edit-mode");
}

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

async function putTaskJson(id, data) {
  const r = await fetch(`${RTDB_BASE}tasks/${id}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("PUT failed: " + r.status);
}

async function afterUpdateUI(id, navigateToBoard, closeOverlayAfter, reopenDetail) {
  if (closeOverlayAfter) closeOverlay(byId("taskOverlay"));
  await window.Board?.renderAllTasks?.();
  if (navigateToBoard) {
    location.href = "board.html";
    return;
  }
  if (reopenDetail) await openTaskDetail(id);
}

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

function updateSubtaskCountersUI(taskId, done, total) {
  const ov = byId("taskDetailOverlay");
  const c = ov?.querySelector(".subtasks-counter");
  if (c) c.textContent = `${done}/${total} Subtasks`;
  const card = document.querySelector(`.card[data-id="${taskId}"]`) || null;
  if (!card) return;
  const meta = card.querySelector(".meta span");
  if (meta) meta.textContent = `${done}/${total} Subtasks`;
  const bar = card.querySelector(".progress .bar");
  if (bar && total > 0) bar.style.width = `${Math.round((done / total) * 100)}%`;
}

function mountSubtaskCheckboxListener() {
  document.addEventListener("change", onDetailSubtaskChange);
}

async function onDetailSubtaskChange(e) {
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
}

/* ----------------------- Assigned / Subtasks (Form) ---------------------- */

function fillAssignedContacts(contacts) {
  const wrap = byId("assignedToInitials");
  wrap.innerHTML = "";
  if (!contacts?.length) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "flex";
  contacts.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "av";
    div.style.background = window.color(i);
    div.textContent = initials(c);
    wrap.appendChild(div);
  });
}

function fillSubtasks(subtasks) {
  const wrap = document.querySelector(".addedSubtaskWrapper");
  wrap.innerHTML = "";
  (subtasks || []).forEach((s) => {
    let txt = typeof s === "string" ? s : s.text;
    txt = txt.replace(/^•\s*/, "");
    wrap.appendChild(createSubtaskElement(txt, !!(typeof s === "object" && s.done)));
  });
}

function renderAssignedInitials() {
  const w = byId("assignedToInitials");
  w.innerHTML = "";
  if (!(assignedContacts && assignedContacts.length)) {
    w.style.display = "none";
    return;
  }
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
