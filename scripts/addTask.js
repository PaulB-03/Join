window.baseURL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

let prioGrade = "";
let selectedPrio = "";
let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
window.assignedContacts = window.assignedContacts || [];

/* ----------------------------- UI Helpers ------------------------------ */

/**
 * Gets the trimmed value of an input field by its ID.
 * @param {string} id - The ID of the input element.
 * @returns {string} Trimmed value of the input or empty string if not found.
 */
function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

/**
 * Shows an inline error message for a form field.
 * @param {HTMLElement} field - The input field to highlight.
 * @param {HTMLElement} errorMessage - The error message element to display.
 */
function showInlineError(field, errorMessage) {
  if (!field || !errorMessage) return;
  field.style.border = "1px solid red";
  errorMessage.style.visibility = "visible";
}

/**
 * Clears all inline error messages and resets field borders.
 */
function clearInlineErrors() {
  document.querySelectorAll(".addTaskErrors").forEach((e) => (e.style.visibility = "hidden"));
  ["titleInput", "date"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.style.border = "";
  });
}

/* --------------------------- Priority Selection ------------------------- */

/**
 * Sets the background color for a priority element based on selection.
 * @param {number} index - Index of the selected priority element.
 */
function setPrioColor(index) {
  const refs = document.getElementsByClassName("prioGrade");
  const ref = refs[index],
    img = ref?.querySelector("img");

  document.querySelectorAll(".prioGrade .prioImage").forEach((i) => i.classList.remove("filterWhite"));
  Array.from(refs).forEach((e) => e.classList.remove("removeHoverEffect", "redColor", "orangeColor", "greenColor"));

  if (ref?.classList.contains("redColor") || ref?.classList.contains("orangeColor") || ref?.classList.contains("greenColor")) return;
  addBackgroundColor(ref, img);
}

/**
 * Adds the background color to a priority element and updates selectedPrio.
 * @param {HTMLElement} ref - Priority element reference.
 * @param {HTMLElement} img - Image inside the priority element.
 */
function addBackgroundColor(ref, img) {
  ref.classList.add(ref.id === "urgent" ? "redColor" : ref.id === "medium" ? "orangeColor" : "greenColor");
  addPrioImgColor(ref, img);
  selectedPrio = ref.id;
}

/**
 * Adds visual styling to the priority image.
 * @param {HTMLElement} ref - Priority element reference.
 * @param {HTMLElement} img - Image inside the priority element.
 */
function addPrioImgColor(ref, img) {
  if (!ref || !img) return;
  ref.classList.add("removeHoverEffect");
  img.classList.add("filterWhite");
}

/**
 * Returns the currently selected priority.
 * @returns {string|null} Selected priority ID or null if none selected.
 */
function getSelectedPriority() {
  return typeof selectedPrio !== "undefined" ? selectedPrio : null;
}

/* --------------------------- Validation --------------------------------- */

/**
 * Validates required task form fields.
 * @returns {boolean} True if all fields are valid, otherwise false.
 */
function validateTaskFormFields() {
  let ok = true;

  if (!getFieldValue("titleInput")) {
    showInlineError(document.getElementById("titleInput"), document.getElementById("titleError"));
    ok = false;
  }
  if (!getFieldValue("date")) {
    showInlineError(document.getElementById("date"), document.getElementById("dateError"));
    ok = false;
  }
  return ok;
}

/* ------------------------------ Payload --------------------------------- */

/**
 * Collects subtasks from the UI.
 * @returns {string[]} Array of subtask titles.
 */
function collectSubtasksFromUI() {
  return Array.from(document.querySelectorAll(".subtaskTitle"))
    .map((el) => el.textContent.trim())
    .filter(Boolean);
}

/**
 * Builds the payload object for a new task from form inputs.
 * @returns {object} Task payload object.
 */
function buildTaskPayloadFromForm() {
  return {
    title: getFieldValue("titleInput"),
    description: getFieldValue("descriptionInput"),
    date: getFieldValue("date"),
    priority: selectedPrio,
    category: window.selectedCategory || "",
    assignedContacts: Array.isArray(window.assignedContacts) ? [...window.assignedContacts] : [],
    state: window.selectedState || "toDo",
    subtasks: collectSubtasksFromUI(),
  };
}

/* ------------------------------ UX -------------------------------------- */

/**
 * Creates a toast message element.
 * @returns {HTMLElement} Toast message element.
 */
function createToastMessage() {
  const msg = document.createElement("div");
  msg.className = "task-added-message";
  msg.innerHTML = `
    Task added to board 
    <img src="../assets/svg/board.svg" 
         alt="Board icon" 
         style="width:30px;height:30px;margin-left:10px;vertical-align:middle">
  `;
  document.body.append(msg);
  return msg;
}

/**
 * Animates the toast message into view.
 * @param {HTMLElement} msg - Toast message element.
 */
function animateToastIn(msg) {
  requestAnimationFrame(() => {
    msg.style.transform = "translate(-50%, -50%)";
  });
}

/**
 * Shows a toast message and redirects to board page after a delay.
 */
function showAddedToastAndRedirect() {
  const msg = createToastMessage();
  animateToastIn(msg);
  setTimeout(() => {
    msg.remove();
    location.href = "board.html";
  }, 900);
}

/* ------------------------------ Create Task ----------------------------- */

/**
 * Creates a new task by sending it to the backend.
 */
async function createTask() {
  clearInlineErrors();
  if (!validateTaskFormFields()) return;
  const b = document.getElementById("add");
  b?.setAttribute("disabled", true);
  try {
    await saveTask("tasks", buildTaskPayloadFromForm());
    showAddedToastAndRedirect();
  } catch (e) {
    console.error(e);
    alert("The task could not be saved.");
  } finally {
    b?.removeAttribute("disabled");
  }
}

/**
 * Handles the add or edit button click for tasks.
 * @param {Event} e - Click event.
 */
function handleAddOrEditTask(e) {
  e?.preventDefault();
  const b = document.getElementById("add");
  const id = b?.getAttribute("data-editing-id");
  if (id) {
    updateTask(id, false, true, true).catch((err) => {
      console.error(err);
      alert("Could not save changes.");
    });
  } else {
    createTask();
  }
}

/* ---------------------------- Form Reset -------------------------------- */

/**
 * Resets the priority selection UI.
 */
function resetPrioUI() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont"));
  document.querySelectorAll(".prioGrade .prioImage").forEach((el) => el.classList.remove("filterWhite"));
  selectedPrio = "";
}

/**
 * Resets the category selection UI.
 */
function resetCategoryUI() {
  selectedCategory = "";
  const ph = document.getElementById("categoryPlaceholder");
  if (ph) ph.textContent = "Select task category";
  document.getElementById("assignedToDropdownCategory")?.classList.remove("selected-red");
  document.querySelectorAll("#dropdown-list-category input[type='checkbox']").forEach((cb) => (cb.checked = false));
}

/**
 * Resets assigned contacts UI and internal state.
 */
function resetAssignedUI() {
  window.assignedContacts = [];
  selectedContact = "";
  const initials = document.getElementById("assignedToInitials");
  if (initials) initials.innerHTML = "";
  const span = document.querySelector("#assignedToDropdownContacts .dropdown-selected span");
  if (span) span.textContent = "Select contact";
}

/**
 * Clears the task form and UI elements.
 */
function clearTask() {
  ["#titleInput", "#descriptionInput", "#date", "#subtaskInput"].forEach((s) => {
    const e = document.querySelector(s);
    if (e) e.value = "";
  });
  document.querySelectorAll(".addTaskErrors").forEach((e) => (e.style.visibility = "hidden"));
  ["#titleInput", "#descriptionInput", "#date", "#assignedToDropdownContacts", "#assignedToDropdownCategory"].forEach((s) => {
    const e = document.querySelector(s);
    if (e) e.style.border = "";
  });
  resetPrioUI();
  resetCategoryUI();
  resetAssignedUI();
  const subWrap = document.querySelector(".addedSubtaskWrapper");
  if (subWrap) subWrap.innerHTML = "";
  const imgC = document.querySelector(".subtask-images-container");
  if (imgC) imgC.style.display = "none";
  const search = document.getElementById("contactSearch");
  if (search) search.value = "";
  const dropdown = document.getElementById("dropdown-list-contacts");
  if (dropdown) dropdown.style.display = "none";
  const arrow = document.getElementById("dropdown-arrow-contacts");
  if (arrow) arrow.style.transform = "translateY(-50%) rotate(0deg)";
  if (window.loadedContacts && typeof renderContacts === "function") renderContacts(window.allContacts, window.loadedContacts);
}

/* ----------------------------- Resize Logic ----------------------------- */

/**
 * Initializes the textarea resize handle logic.
 */
(() => {
  const textarea = document.getElementById("descriptionInput");
  const handle = document.querySelector(".resize-handle");
  if (!textarea || !handle) return;

  let isResizing = false;
  let startY = 0;
  let startHeight = 0;

  function startResize(e) {
    isResizing = true;
    startY = e.clientY;
    startHeight = parseInt(getComputedStyle(textarea).height, 10);
    attachListeners();
    e.preventDefault();
  }

  function resize(e) {
    if (!isResizing) return;
    const newHeight = calculateNewHeight(e.clientY - startY);
    textarea.style.height = newHeight + "px";
  }

  function stopResize() {
    isResizing = false;
    detachListeners();
  }

  function calculateNewHeight(deltaY) {
    const minHeight = parseInt(getComputedStyle(textarea).minHeight, 10);
    const maxHeight = parseInt(getComputedStyle(textarea).maxHeight, 10);
    const newHeight = startHeight + deltaY;
    return Math.max(minHeight, Math.min(maxHeight, newHeight));
  }

  function attachListeners() {
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  }

  function detachListeners() {
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }

  handle.addEventListener("mousedown", startResize);
})();

/* ----------------------------- Date Input ----------------------------- */

/**
 * Returns the date input element.
 * @returns {HTMLInputElement|null} Date input element.
 */
function getDateInput() {
  return document.getElementById("date");
}

/**
 * Returns today's date in ISO format.
 * @returns {string} Today's date in YYYY-MM-DD format.
 */
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Resets the date input if a past date is entered.
 * @param {HTMLInputElement} input - Date input element.
 */
function resetIfPastDate(input) {
  if (!input.value) return;
  const inputDate = new Date(input.value).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  if (inputDate < today) input.value = "";
}

/**
 * Opens the date picker for an input field.
 * @param {HTMLInputElement} input - Date input element.
 */
function openDatePicker(input) {
  try {
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  } catch {
    input.focus();
  }
}

/**
 * Binds events for date input (click and blur).
 * @param {HTMLInputElement} input - Date input element.
 */
function bindDateInputEvents(input) {
  input.addEventListener("click", () => openDatePicker(input));
  input.addEventListener("blur", () => resetIfPastDate(input));
}

/**
 * Initializes the date input with minimum date and events.
 */
function initDateInput() {
  const input = getDateInput();
  if (!input) return;
  input.min = todayISO();
  bindDateInputEvents(input);
}

document.addEventListener("DOMContentLoaded", initDateInput);

/* ----------------------------- Exports ---------------------------------- */
window.createTask = window.createTask || createTask;
window.clearTask = window.clearTask || clearTask;
window.getSubtasksFromForm = window.getSubtasksFromForm || collectSubtasksFromUI;
window.setPrioColor = window.setPrioColor || setPrioColor;
