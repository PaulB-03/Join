/**
 * Currently selected priority level (`urgent` | `medium` | `low`).
 *
 * @type {string}
 */
let selectedPrio = "";

/**
 * Activates a priority option by its index and applies corresponding styles.
 *
 * Removes previous visual states and prevents re-selection of the same priority.
 *
 * @function setPrioColor
 * @param {number} index - The index of the element in the `.prioGrade` NodeList.
 * @returns {void}
 */
function setPrioColor(index) {
  const refs = document.getElementsByClassName("prioGrade");
  const ref = refs[index];
  const img = ref?.querySelector("img");
  document.querySelectorAll(".prioGrade .prioImage").forEach((i) => i.classList.remove("filterWhite"));
  Array.from(refs).forEach((e) => e.classList.remove("removeHoverEffect", "redColor", "orangeColor", "greenColor"));
  if (ref?.classList.contains("redColor") || ref?.classList.contains("orangeColor") || ref?.classList.contains("greenColor")) return;
  addBackgroundColor(ref, img);
}

/**
 * Adds the appropriate background color for the selected priority.
 *
 * Also updates the global `selectedPrio` variable and triggers icon color styling.
 *
 * @function addBackgroundColor
 * @param {HTMLElement} ref - The priority button element.
 * @param {HTMLImageElement} img - The image element inside the priority button.
 * @returns {void}
 */
function addBackgroundColor(ref, img) {
  if (!ref) return;
  const colorMap = { urgent: "redColor", medium: "orangeColor", low: "greenColor" };
  const colorClass = colorMap[ref.id] || "greenColor";
  ref.classList.add(colorClass);
  addPrioImgColor(ref, img);
  selectedPrio = ref.id;
}

/**
 * Applies white filter styling to the priority icon and removes hover effects.
 *
 * @function addPrioImgColor
 * @param {HTMLElement} ref - The priority button element.
 * @param {HTMLImageElement} img - The icon image to colorize.
 * @returns {void}
 */
function addPrioImgColor(ref, img) {
  if (!ref || !img) return;
  ref.classList.add("removeHoverEffect");
  img.classList.add("filterWhite");
}

/**
 * Returns the currently selected priority level, or `null` if none is selected.
 *
 * @function getSelectedPriority
 * @returns {("urgent"|"medium"|"low"|null)} The current priority selection.
 */
function getSelectedPriority() {
  return selectedPrio || null;
}

/**
 * Resets the entire priority selection UI.
 *
 * Removes all color and state classes, clears white icon filters,
 * and resets `selectedPrio` to an empty string.
 *
 * @function resetPrioUI
 * @returns {void}
 */
function resetPrioUI() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont"));
  document.querySelectorAll(".prioGrade .prioImage").forEach((el) => el.classList.remove("filterWhite"));
  selectedPrio = "";
}

/**
 * Builds the task payload object from current form field values.
 *
 * Includes title, description, date, priority, category, assigned contacts,
 * state, and subtasks.
 *
 * @function buildTaskPayloadFromForm
 * @returns {Object} Task payload object for POST/PATCH requests to `/tasks`.
 * @property {string} title - Task title from the form input.
 * @property {string} description - Task description.
 * @property {string} date - Task due date.
 * @property {string} priority - The selected priority level.
 * @property {string} category - The selected category.
 * @property {string[]} assignedContacts - List of assigned contacts.
 * @property {string} state - Task state (e.g., `"toDo"`).
 * @property {Object[]} subtasks - Collected subtasks from the UI.
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

/**
 * Binds click event handlers to all `.prioGrade` buttons.
 *
 * Each button sets its corresponding priority color on click.
 *
 * @function initialisePriorityHandlers
 * @returns {void}
 */
function initialisePriorityHandlers() {
  const items = document.querySelectorAll(".prioGrade");
  items.forEach((el, i) => el.addEventListener("click", () => setPrioColor(i)));
}

// --- Public API ---

/**
 * Public priority API exposed globally for other modules.
 *
 * @namespace window.priority
 * @property {Function} setPrioColor - Activates a priority color by index.
 * @property {Function} getSelectedPriority - Returns the currently selected priority.
 * @property {Function} resetPrioUI - Resets all priority UI states.
 * @property {Function} buildTaskPayloadFromForm - Builds a complete task payload object.
 * @property {Function} initialisePriorityHandlers - Sets up event handlers for priority buttons.
 */
window.priority = {
  setPrioColor,
  getSelectedPriority,
  resetPrioUI,
  buildTaskPayloadFromForm,
  initialisePriorityHandlers, // Optional manual call if needed
};

/**
 * Automatically binds priority button event handlers when the DOM is fully loaded.
 *
 * @event DOMContentLoaded
 * @fires initialisePriorityHandlers
 */
document.addEventListener("DOMContentLoaded", initialisePriorityHandlers);
