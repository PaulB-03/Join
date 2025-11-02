/**
 * Clears all form fields and resets UI sections for Add Task.
 * Includes inputs, dropdowns, subtasks, and error styles.
 * @returns {void}
 */
function clearTask() {
  clearFormInputs();
  hideFormErrors();
  resetFieldBorders();
  resetAssignedContacts();
  clearSubtasks();
  resetDropDown();
  clearCategory()
}

/* ---------------- Helper Functions ---------------- */

/**
 * Shorthand for document.querySelector().
 * @param {string} s - CSS selector.
 * @returns {HTMLElement|null} Matching element or null.
 */
function $(s) {
  return document.querySelector(s);
}

/**
 * Clears all relevant form input fields.
 * @returns {void}
 */
function clearFormInputs() {
  ["#titleInput", "#descriptionInput", "#date", "#subtaskInput"].forEach((s) => {
    const el = $(s);
    if (el) el.value = "";
  });
}

/**
 * Hides all visible inline form error messages.
 * @returns {void}
 */
function hideFormErrors() {
  document.querySelectorAll(".addTaskErrors").forEach((e) => {
    e.style.visibility = "hidden";
  });
}

/**
 * Resets borders of key form fields to default state.
 * @returns {void}
 */
function resetFieldBorders() {
  const selectors = ["#titleInput", "#descriptionInput", "#date", "#assignedToDropdownContacts", "#assignedToDropdownCategory"];
  selectors.forEach((s) => {
    const el = $(s);
    if (el) el.style.border = "";
  });
}

/**
 * Clears all subtasks and hides the subtask control images.
 * @returns {void}
 */
function clearSubtasks() {
  const wrapper = $(".addedSubtaskWrapper");
  if (wrapper) wrapper.innerHTML = "";

  const imgContainer = $(".subtask-images-container");
  if (imgContainer) imgContainer.style.display = "none";
}

function resetAssignedContacts() {
  window.assignedContacts = [];
  selectedContact = "";
  document.getElementById("assignedToInitials").innerHTML = "";
  updateDropdownHighlight();
}

function clearCategory() {
  let categoryPlaceholder = document.getElementById('categoryPlaceholder')

  categoryPlaceholder.innerHTML = "Select task category"
}