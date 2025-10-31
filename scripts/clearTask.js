/**
 * Clears all form fields and resets UI sections for Add Task.
 * Includes inputs, dropdowns, subtasks, and error styles.
 * @returns {void}
 */
function clearTask() {
  clearFormInputs();
  hideFormErrors();
  resetFieldBorders();
  resetUISections();
  clearSubtasks();
  resetContactDropdown();
  rerenderContactsIfLoaded();
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
  const selectors = [
    "#titleInput",
    "#descriptionInput",
    "#date",
    "#assignedToDropdownContacts",
    "#assignedToDropdownCategory",
  ];
  selectors.forEach((s) => {
    const el = $(s);
    if (el) el.style.border = "";
  });
}

/**
 * Resets priority, category, and assigned UI sections if available.
 * @returns {void}
 */
function resetUISections() {
  if (typeof resetPrioUI === "function") resetPrioUI();
  
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
 * Resets contact dropdown search field, closes dropdown, resets arrow.
 * @returns {void}
 */
function resetContactDropdown() {
  const search = document.getElementById("contactSearch");
  if (search) search.value = "";

  const dropdown = document.getElementById("dropdown-list-contacts");
  if (dropdown) dropdown.style.display = "none";

  const arrow = document.getElementById("dropdown-arrow-contacts");
  if (arrow) arrow.style.transform = "translateY(-50%) rotate(0deg)";
}

/**
 * Re-renders the contact list if contacts are already loaded.
 * Used to visually reset dropdown state.
 * @returns {void}
 */
function rerenderContactsIfLoaded() {
  if (window.loadedContacts && typeof renderContacts === "function") {
    renderContacts(window.allContacts, window.loadedContacts);
  }
}
