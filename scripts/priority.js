// --- Internal state ---
/**
 * Aktuell gewählte Priorität (urgent|medium|low).
 * @type {string}
 */
let selectedPrio = "";

// --- Core Logic ---

/**
 * Aktiviert eine Priorität per Index und setzt Styles.
 * Entfernt vorherige Zustände und verhindert erneutes Selektieren.
 * @param {number} index - Index im .prioGrade-NodeList
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
 * Fügt passende Hintergrundfarbe zur gewählten Priorität hinzu.
 * Setzt selectedPrio und triggert Icon-Färbung.
 * @param {HTMLElement} ref
 * @param {HTMLImageElement} img
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
 * Färbt das Prioritäts-Icon (weiß) und entfernt Hover-Effekt.
 * @param {HTMLElement} ref
 * @param {HTMLImageElement} img
 * @returns {void}
 */
function addPrioImgColor(ref, img) {
  if (!ref || !img) return;
  ref.classList.add("removeHoverEffect");
  img.classList.add("filterWhite");
}

/**
 * Liefert aktuell ausgewählte Priorität oder null.
 * @returns {("urgent"|"medium"|"low"|null)}
 */
function getSelectedPriority() {
  return selectedPrio || null;
}

/**
 * Setzt die Prioritäts-UI komplett zurück.
 * Entfernt Farben/States und löscht selectedPrio.
 * @returns {void}
 */
function resetPrioUI() {
  document.querySelectorAll(".prioGrade").forEach((el) =>
    el.classList.remove("isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont")
  );
  document.querySelectorAll(".prioGrade .prioImage").forEach((el) => el.classList.remove("filterWhite"));
  selectedPrio = "";
}

/**
 * Baut den Task-Payload aus Formularfeldern (inkl. Priorität).
 * @returns {Object} Payload für POST/PATCH /tasks
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

// --- Initialization ---

/**
 * Bindet Click-Handler auf alle .prioGrade-Buttons.
 * @returns {void}
 */
function initialisePriorityHandlers() {
  const items = document.querySelectorAll(".prioGrade");
  items.forEach((el, i) => el.addEventListener("click", () => setPrioColor(i)));
}

// --- Public API ---
/**
 * Öffentliche Priority-API für andere Module.
 */
window.priority = {
  setPrioColor,
  getSelectedPriority,
  resetPrioUI,
  buildTaskPayloadFromForm,
  initialisePriorityHandlers, // optional manual call if needed
};

// --- Auto-init when DOM is ready ---
/** Bindet Priority-Handler automatisch nach DOM-Load. */
document.addEventListener("DOMContentLoaded", initialisePriorityHandlers);
