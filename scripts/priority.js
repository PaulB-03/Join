// --- Internal state ---
let selectedPrio = "";

// --- Core Logic ---

function setPrioColor(index) {
  const refs = document.getElementsByClassName("prioGrade");
  const ref = refs[index];
  const img = ref?.querySelector("img");

  // Clear previous states
  document.querySelectorAll(".prioGrade .prioImage").forEach((i) => i.classList.remove("filterWhite"));
  Array.from(refs).forEach((e) => e.classList.remove("removeHoverEffect", "redColor", "orangeColor", "greenColor"));

  // Prevent reselecting same priority
  if (ref?.classList.contains("redColor") || ref?.classList.contains("orangeColor") || ref?.classList.contains("greenColor")) return;

  addBackgroundColor(ref, img);
}

function addBackgroundColor(ref, img) {
  if (!ref) return;

  const colorMap = {
    urgent: "redColor",
    medium: "orangeColor",
    low: "greenColor",
  };

  const colorClass = colorMap[ref.id] || "greenColor";
  ref.classList.add(colorClass);

  addPrioImgColor(ref, img);
  selectedPrio = ref.id;
}

function addPrioImgColor(ref, img) {
  if (!ref || !img) return;
  ref.classList.add("removeHoverEffect");
  img.classList.add("filterWhite");
}

function getSelectedPriority() {
  return selectedPrio || null;
}

function resetPrioUI() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont"));
  document.querySelectorAll(".prioGrade .prioImage").forEach((el) => el.classList.remove("filterWhite"));
  selectedPrio = "";
}

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

function initialisePriorityHandlers() {
  const items = document.querySelectorAll(".prioGrade");
  items.forEach((el, i) => el.addEventListener("click", () => setPrioColor(i)));
}

// --- Public API ---
window.priority = {
  setPrioColor,
  getSelectedPriority,
  resetPrioUI,
  buildTaskPayloadFromForm,
  initialisePriorityHandlers, // optional manual call if needed
};

// --- Auto-init when DOM is ready ---
document.addEventListener("DOMContentLoaded", initialisePriorityHandlers);
