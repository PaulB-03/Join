let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
window.assignedContacts = window.assignedContacts || [];

/**
 * Returns trimmed value of input by id.
 * @param {string} id
 * @returns {string}
 */
function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

/**
 * Shows inline error styling.
 * @param {HTMLElement} field
 * @param {HTMLElement} errorMessage
 * @returns {void}
 */
function showInlineError(field, errorMessage) {
  if (!field || !errorMessage) return;
  field.style.border = "1px solid red";
  errorMessage.style.visibility = "visible";
}

function showCategoryError(field) {
  field.style.border = "1px solid red";
}

/**
 * Clears all inline form errors.
 * @returns {void}
 */
function clearInlineErrors() {
  document.querySelectorAll(".addTaskErrors").forEach((e) => (e.style.visibility = "hidden"));
  ["titleInput", "date", "input-category"].forEach((id) => {
    const f = document.getElementById(id);
    if (f) f.style.border = "";
  });
}

/**
 * Validates required fields of task form.
 * @returns {boolean}
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
  if (window.selectedCategory == undefined) {
    showCategoryError(document.getElementById("input-category"));
    ok = false;
  }
  return ok;
}

/**
 * Collects subtasks from UI.
 * @returns {string[]}
 */
function collectSubtasksFromUI() {
  return Array.from(document.querySelectorAll(".subtaskTitle"))
    .map((el) => el.textContent.trim())
    .filter(Boolean);
}

/**
 * Builds payload from form fields.
 * @returns {object}
 */
function buildTaskPayloadFromForm() {
  return {
    title: getFieldValue("titleInput"),
    description: getFieldValue("descriptionInput"),
    date: getFieldValue("date"),
    priority: priority.getSelectedPriority(),
    category: window.selectedCategory || "",
    assignedContacts: Array.isArray(window.assignedContacts) ? [...window.assignedContacts] : [],
    state: window.selectedState || "toDo",
    subtasks: collectSubtasksFromUI(),
  };
}

/**
 * Persists a task to backend.
 * @param {object} payload
 * @returns {Promise<any>}
 */
async function persistTask(payload) {
  const res = await fetch(`${baseURL}tasks.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("POST /tasks failed: " + res.status);
  return res.json();
}

/**
 * Handles task creation.
 * @param {Event} [event]
 * @returns {Promise<void>}
 */

let isCreatingTask = false;

async function createTask(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const b = document.getElementById("add");
  if (b) {
    b.setAttribute("disabled", true);
  }
  if (isCreatingTask) return;
  isCreatingTask = true;

  clearInlineErrors();
  if (!validateTaskFormFields()) {
    b?.removeAttribute("disabled");
    isCreatingTask = false;
    return;
  }

  try {
    await persistTask(buildTaskPayloadFromForm());
    showAddedToastAndRedirect();
  } catch (e) {
    console.error(e);
    b?.removeAttribute("disabled");
    isCreatingTask = false;
  } finally {
    if (!isCreatingTask) {
      b?.removeAttribute("disabled");
    }
  }
}

/**
 * Selects a contact and updates initials preview.
 * @param {{id:string,name:string}} contact
 * @returns {void}
 */
function selectContact(contact) {
  if (!contact) return;
  if (!window.assignedContacts.some((c) => c.id === contact.id)) window.assignedContacts.push(contact);
  const initials = document.getElementById("assignedToInitials");
  if (initials) initials.textContent = window.assignedContacts.map((c) => c.name[0]).join(", ");
}

/**
 * Wires main button on DOM ready.
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("add");
  if (addBtn) addBtn.onclick = handleAddOrEditTask;
  setDefaultMediumPriority();
  const clearBtn = document.getElementById("clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      setTimeout(setDefaultMediumPriority, 0);
    });
  }
  const form = document.getElementById("addTaskForm");
  if (form) {
    form.addEventListener("reset", () => setTimeout(setDefaultMediumPriority, 0));
  }
});
