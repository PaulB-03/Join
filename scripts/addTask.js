/* ----------------------------- Config/State ------------------------------ */
/**
 * Base URL for backend.
 * @type {string}
 */
const baseURL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
window.assignedContacts = window.assignedContacts || [];

/* ----------------------------- UI-Helpers ------------------------------ */
/**
 * Returns element by id.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function $id(id) {
  return document.getElementById(id);
}

/**
 * Returns trimmed value of input by id.
 * @param {string} id
 * @returns {string}
 */
function getFieldValue(id) {
  const el = $id(id);
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

/**
 * Clears all inline form errors.
 * @returns {void}
 */
function clearInlineErrors() {
  document.querySelectorAll(".addTaskErrors").forEach((e) => (e.style.visibility = "hidden"));
  ["titleInput", "date"].forEach((id) => {
    const f = $id(id);
    if (f) f.style.border = "";
  });
}

/* --------------------------- Validation --------------------------------- */
/**
 * Validates required fields of task form.
 * @returns {boolean}
 */
function validateTaskFormFields() {
  let ok = true;
  if (!getFieldValue("titleInput")) {
    showInlineError($id("titleInput"), $id("titleError"));
    ok = false;
  }
  if (!getFieldValue("date")) {
    showInlineError($id("date"), $id("dateError"));
    ok = false;
  }
  if (!window.selectedCategory) {
    ok = false;
  }
  return ok;
}

/* ------------------------------ Payload --------------------------------- */
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

/* ----------------------------- API Calls -------------------------------- */
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

/* ------------------------------ Create ---------------------------------- */
/**
 * Handles task creation.
 * @returns {Promise<void>}
 */
async function createTask() {
  clearInlineErrors();
  if (!validateTaskFormFields()) return;
  const b = $id("add");
  b?.setAttribute("disabled", true);
  try {
    await persistTask(buildTaskPayloadFromForm());
    showAddedToastAndRedirect();
  } catch (e) {
    console.error(e);
  } finally {
    b?.removeAttribute("disabled");
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
  const initials = $id("assignedToInitials");
  if (initials) initials.textContent = window.assignedContacts.map((c) => c.name[0]).join(", ");
}

/* ---------------------------- Bootstraps -------------------------------- */
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
