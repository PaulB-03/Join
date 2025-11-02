/* ---------------------------- Subtasks (Form) ---------------------------- */
/**
 * Reads subtasks from overlay form (text + done).
 * @returns {{text:string,done:boolean}[]}
 */
function getSubtasksFromForm() {
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  if (!wrapper) return [];
  return Array.from(wrapper.querySelectorAll(".subtask, .subtaskTitle"))
    .map((el) => {
      const text = el.textContent.trim();
      if (!text) return null;
      const done = el.querySelector?.("input[type=checkbox]")?.checked || false;
      return { text, done };
    })
    .filter(Boolean);
}

/* --------------------------- Kontakte / Suche ---------------------------- */
// /**
//  * Loads contacts list (delegates to external loader).
//  * @returns {Promise<void>}
//  */
// async function loadContacts(){ if(typeof loadContactsInAddTask==="function") await loadContactsInAddTask(); }

/**
 * Updates initials preview bubble.
 * @returns {void}
 */
function updateInitialsPreview() {
  const initials = $id("assignedToInitials");
  if (initials) {
    initials.style.display = "block";
    initials.textContent = window.assignedContacts.map((x) => x.name[0]).join(", ");
  }
}

/**
 * Attaches click handler to one contact item.
 * @param {Element} it
 * @param {Function} closeFn
 * @returns {void}
 */
function wireContactItem(it, closeFn) {
  it.addEventListener("click", (e) => {
    e.stopPropagation();
    const c = { id: it.dataset.id, name: it.dataset.name };
    if (!window.assignedContacts.some((x) => x.id === c.id)) window.assignedContacts.push(c);
    updateInitialsPreview();
    closeFn();
  });
}

/* ------------------------------ Bootstraps ------------------------------- */
/**
 * Wires UI initializers on DOM ready.
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", () => {
  initDateMinAndPicker();
});

/* --------------------------- Textarea Resize ----------------------------- */
let _isResizing = false,
  _startY = 0,
  _startH = 0;
/**
 * Begins textarea resize.
 * @param {MouseEvent} e
 * @returns {void}
 */
function beginResize(e) {
  const t = document.getElementById("descriptionInput");
  if (!t) return;
  _isResizing = true;
  _startY = e.clientY;
  _startH = parseInt(getComputedStyle(t).height, 10);
  document.addEventListener("mousemove", doResize);
  document.addEventListener("mouseup", endResize);
  e.preventDefault();
}
/**
 * Performs resize on mousemove.
 * @param {MouseEvent} e
 * @returns {void}
 */
function doResize(e) {
  if (!_isResizing) return;
  const t = document.getElementById("descriptionInput");
  if (!t) return;
  const delta = e.clientY - _startY;
  let nh = _startH + delta;
  const min = parseInt(getComputedStyle(t).minHeight, 10),
    max = parseInt(getComputedStyle(t).maxHeight, 10);
  nh = Math.max(min, Math.min(max, nh));
  t.style.height = nh + "px";
}
/**
 * Ends resize and unbinds listeners.
 * @returns {void}
 */
function endResize() {
  _isResizing = false;
  document.removeEventListener("mousemove", doResize);
  document.removeEventListener("mouseup", endResize);
}
/**
 * Wires custom textarea resize handle.
 * @returns {void}
 */
(function wireTextareaResize() {
  const textarea = document.getElementById("descriptionInput");
  const handle = document.querySelector(".resize-handle");
  if (textarea && handle) handle.addEventListener("mousedown", beginResize);
})();

/* ------------------------- Date Validation (flatpickr) ------------------- */
/**
 * Validates manual date input as future date (DD/MM/YYYY).
 * @param {unknown} _ - unused
 * @param {string} dateStr
 * @param {{setDate:(d:Date,keep:boolean)=>void, clear:()=>void}} instance
 * @returns {void}
 */
function validateFutureDate(_, dateStr, instance) {
  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    instance.clear();
    return;
  }
  const [d, m, y] = parts;
  const typed = new Date(`${y}-${m}-${d}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!isNaN(typed) && typed >= today) {
    instance.setDate(typed, true);
  } else {
    instance.clear();
  }
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

/* ----------------------------- Add / Edit ------------------------------- */

/**
 * Handles form submit: create or update task.
 * @param {Event} [e]
 * @returns {Promise<void>}
 */
async function handleAddOrEditTask(e) {
  e && e.preventDefault();
  const id = document.getElementById("add")?.getAttribute("data-editing-id");
  if (!id) {
    return typeof window.createTask === "function" ? window.createTask() : console.error("createTask not found");
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
  if (navigateToBoard) {
    location.href = "board.html";
    return;
  }
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
  }
}

function setDefaultMediumPriority() {
  try {
    if (window.priority && typeof window.priority.setSelectedPriority === "function") {
      window.priority.setSelectedPriority("medium");
    }
  } catch {}
  window.selectedPrio = "medium";
  try {
    if (typeof window.setPrioColor === "function") {
      window.setPrioColor("medium");
      return;
    }
  } catch {}

  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("active"));
  const mediumBtn = document.querySelector(".prioGrade.medium") || document.querySelector('[data-prio="medium"]');
  if (mediumBtn) mediumBtn.classList.add("active");
}

function createToastMessage(){
    const msg=document.createElement("div");
    msg.className="task-added-message";
    msg.innerHTML=`Task added to board 
      <img src="../assets/svg/board.svg" alt="Board icon"
           style="width:30px;height:30px;margin-left:10px;vertical-align:middle">`;
    document.body.append(msg); return msg;
  }
  
  /**
   * Animates toast into view.
   * @param {HTMLElement} msg
   * @returns {void}
   */
  function animateToastIn(msg){
    requestAnimationFrame(()=>{ msg.style.transform="translate(-50%, -50%)"; });
  }
  
  /**
   * Shows toast and redirects to board.
   * @returns {void}
   */
  function showAddedToastAndRedirect(){
    const msg=createToastMessage(); animateToastIn(msg);
    setTimeout(()=>{ msg.remove(); location.href="board.html"; },900);
  }