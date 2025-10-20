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
  editActions
    .querySelector(".saveEdit")
    .addEventListener("click", () =>
      exitEdit(item, title, editInput, actions, editActions, true)
    );
  editActions
    .querySelector(".cancelEdit")
    .addEventListener("click", () => item.remove());
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
