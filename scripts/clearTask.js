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
  clearCategory();
}

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
  const selectors = ["#titleInput", "#descriptionInput", "#date", "#assignedToDropdownContacts", "#assignedToDropdownCategory", "#input-category"];
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

/**
 * Resets the list of assigned contacts and clears the contact selection UI.
 *
 * This function performs the following:
 * 1. Empties the global `window.assignedContacts` array.
 * 2. Resets the `selectedContact` variable to an empty string.
 * 3. Clears the displayed initials in the element with ID `assignedToInitials`.
 * 4. Calls `updateDropdownHighlight()` to refresh the visual state of the contact dropdown.
 *
 * @function resetAssignedContacts
 * @returns {void} This function does not return a value.
 *
 * @global
 * @property {Array} window.assignedContacts - A global array tracking assigned contacts.
 * @property {string} selectedContact - The currently selected contact (reset to an empty string).
 */
function resetAssignedContacts() {
  window.assignedContacts = [];
  selectedContact = "";
  document.getElementById("assignedToInitials").innerHTML = "";
  updateDropdownHighlight();
}

/**
 * Clears the currently selected category and resets the category placeholder text.
 *
 * This function sets:
 * - `window.selectedCategory` to `undefined`.
 * - The inner HTML of the element with ID `categoryPlaceholder` to `"Select task category"`.
 *
 * @function clearCategory
 * @returns {void} This function does not return a value.
 *
 * @global
 * @property {string|undefined} window.selectedCategory - The currently selected task category (reset to undefined).
 */
function clearCategory() {
  let categoryPlaceholder = document.getElementById("categoryPlaceholder");
  window.selectedCategory = undefined;
  categoryPlaceholder.innerHTML = "Select task category";
}
