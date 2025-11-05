/**
 * Initializes the subtask input field and its control buttons.
 * @returns {void}
 */
function initSubtaskUI() {
  const input = document.querySelector(".input-subtask");
  const controls = document.querySelector(".subtask-images-container");
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  const cancelBtn = document.querySelector(".cancelSubtask");
  const saveBtn = document.querySelector(".saveSubtask");
  const toggle = () => toggleControls(input, controls);
  input.addEventListener("focus", toggle);
  input.addEventListener("input", toggle);
  input.addEventListener("keydown", (e) => handleEnter(e, saveBtn));
  input.addEventListener("blur", () => handleBlur(input, controls));
  cancelBtn.addEventListener("click", () => handleCancel(input, controls));
  saveBtn.addEventListener("click", () => handleSave(input, wrapper, toggle));
}

/**
 * Shows or hides the subtask control buttons.
 * @param {HTMLInputElement} input - The text input element.
 * @param {HTMLElement} controls - The button container.
 */
function toggleControls(input, controls) {
  const active = document.activeElement === input;
  const hasValue = !!input.value.trim();
  controls.style.display = active || hasValue ? "flex" : "none";
}

/**
 * Handles the Enter key to trigger saving.
 * @param {KeyboardEvent} e - Keyboard event.
 * @param {HTMLElement} saveBtn - The save button.
 */
function handleEnter(e, saveBtn) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  saveBtn.click();
}

/**
 * Hides controls if input is empty on blur.
 * @param {HTMLInputElement} input - The text input.
 * @param {HTMLElement} controls - The control buttons container.
 */
function handleBlur(input, controls) {
  if (!input.value.trim()) controls.style.display = "none";
}

/**
 * Clears input and refocuses after cancel.
 * @param {HTMLInputElement} input - The text input.
 * @param {HTMLElement} controls - The control container.
 */
function handleCancel(input, controls) {
  input.value = "";
  toggleControls(input, controls);
  input.focus();
}

/**
 * Saves a new subtask and clears the input field.
 * @param {HTMLInputElement} input - The text input.
 * @param {HTMLElement} wrapper - Container for added subtasks.
 * @param {Function} toggle - Function to show/hide controls.
 */
function handleSave(input, wrapper, toggle) {
  const text = input.value.trim();
  if (!text) return;
  const item = window.createSubtaskElement(text);
  wrapper.appendChild(item);
  input.value = "";
  toggle();
}

/**
 * Creates a subtask list element with edit/delete options.
 * @param {string} text - The subtask text.
 * @returns {HTMLLIElement} The created list item.
 */
window.createSubtaskElement = function (text) {
  const item = document.createElement("li");
  item.className = "subtaskItem";
  item.innerHTML = `
    <span class="subtaskTitle">${escapeHtml(text)}</span>
    <div class="subtaskActions">
      <img src="../assets/svg/subedit.svg" alt="Edit" class="editIcon">
      <div class="divider1"></div>
      <img src="../assets/svg/subdelete.svg" alt="Delete" class="deleteIcon">
    </div>`;
  const title = item.querySelector(".subtaskTitle");
  const actions = item.querySelector(".subtaskActions");
  const del = item.querySelector(".deleteIcon");
  const edit = item.querySelector(".editIcon");
  title.addEventListener("click", () => enterEditMode(item, title, actions));
  edit.addEventListener("click", () => enterEditMode(item, title, actions));
  del.addEventListener("click", () => item.remove());
  return item;
};

/**
 * Enables edit mode for a subtask item.
 * @param {HTMLLIElement} item - The list item element.
 * @param {HTMLElement} title - The title span element.
 * @param {HTMLElement} actions - The default action buttons container.
 */
function enterEditMode(item, title, actions) {
  item.style.backgroundColor = "#fff";
  title.style.display = "none";
  const editInput = createEditInput(title.textContent.trim());
  const editActions = createEditActions();
  item.insertBefore(editInput, actions);
  item.replaceChild(editActions, actions);
  editActions.querySelector(".saveEdit").addEventListener("click", () => exitEdit(item, title, editInput, actions, editActions, true));
  editActions.querySelector(".cancelEdit").addEventListener("click", () => item.remove());
  editInput.focus();
}

/**
 * Creates the editable input element.
 * @param {string} value - The current subtask text.
 * @returns {HTMLInputElement} The edit input element.
 */
function createEditInput(value) {
  const input = document.createElement("input");
  input.value = value;
  input.className = "editInput";
  return input;
}

/**
 * Creates the action buttons for edit mode.
 * @returns {HTMLDivElement} The edit mode action buttons container.
 */
function createEditActions() {
  const div = document.createElement("div");
  div.className = "subtaskActions";
  div.innerHTML = `
    <img src="../assets/svg/subdelete.svg" alt="Cancel" class="cancelEdit">
    <div class="divider1"></div>
    <img src="../assets/svg/subcheck.svg" alt="Save" class="saveEdit">`;
  return div;
}

/**
 * Exits edit mode and optionally saves changes.
 * @param {HTMLLIElement} item - The subtask list item.
 * @param {HTMLElement} title - The title span element.
 * @param {HTMLInputElement} editInput - The active edit input.
 * @param {HTMLElement} actions - The default actions container.
 * @param {HTMLElement} editActions - The edit actions container.
 * @param {boolean} save - Whether to save the edited text.
 */
function exitEdit(item, title, editInput, actions, editActions, save) {
  if (save && editInput.value.trim()) {
    title.textContent = escapeHtml(editInput.value.trim());
  }
  title.style.display = "inline";
  item.style.backgroundColor = "";
  item.removeChild(editInput);
  item.replaceChild(actions, editActions);
}

/**
 * Escapes HTML characters in text to prevent injection.
 * @param {string} text - The input text.
 * @returns {string} The escaped HTML string.
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Runs initialization after DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", initSubtaskUI);


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
  const ov = byId("taskDetailOverlay"),
    c = ov?.querySelector(".subtasks-counter");
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
  const detail = cb.closest(".task-detail"),
    taskId = detail?.getAttribute("data-id");
  if (!taskId) return;
  const previous = !cb.checked;
  try {
    const { done, total } = await saveSubtasksFromOverlay(taskId);
    updateSubtaskCountersUI(taskId, done, total);
    document.dispatchEvent(new CustomEvent("task:updated", { detail: { taskId, done, total } }));
  } catch (err) {
    console.error(err);
    cb.checked = previous;
  }
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

// /**
//  * Renders initials for globally selected assignedContacts.
//  * @returns {void}
//  */
// function renderAssignedInitials() {
// const w = byId("assignedToInitials");
// w.innerHTML = "";
// if (!(assignedContacts && assignedContacts.length)) {
// w.style.display = "none";
// return;
// }
// w.style.display = "flex";
// assignedContacts.forEach((i) => {
// const d = document.createElement("div");
// d.className = "av";
// d.style.background = colorForName(i);
// d.textContent = initials(i);
// w.appendChild(d);
// });
// }
