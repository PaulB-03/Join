const baseURL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

let prioGrade = "";
let selectedPrio = "";
let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
window.assignedContacts = window.assignedContacts || [];

/* ----------------------------- UI Helpers ------------------------------ */

function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function showInlineError(field, errorMessage) {
  if (!field || !errorMessage) return;
  field.style.border = "1px solid red";
  errorMessage.style.visibility = "visible";
}

function clearInlineErrors() {
  document.querySelectorAll(".addTaskErrors").forEach((e) => (e.style.visibility = "hidden"));
  ["titleInput", "date"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.style.border = "";
  });
}

/* --------------------------- Priority Selection ------------------------- */

function setPrioColor(index) {
  const refs = document.getElementsByClassName("prioGrade");
  const ref = refs[index],
    img = ref?.querySelector("img");

  document.querySelectorAll(".prioGrade .prioImage").forEach((i) => i.classList.remove("filterWhite"));
  Array.from(refs).forEach((e) => e.classList.remove("removeHoverEffect", "redColor", "orangeColor", "greenColor"));

  if (ref?.classList.contains("redColor") || ref?.classList.contains("orangeColor") || ref?.classList.contains("greenColor")) return;
  addBackgroundColor(ref, img);
}

function addBackgroundColor(ref, img) {
  ref.classList.add(ref.id === "urgent" ? "redColor" : ref.id === "medium" ? "orangeColor" : "greenColor");
  addPrioImgColor(ref, img);
  selectedPrio = ref.id;
}

function addPrioImgColor(ref, img) {
  if (!ref || !img) return;
  ref.classList.add("removeHoverEffect");
  img.classList.add("filterWhite");
}

function getSelectedPriority() {
  return typeof selectedPrio !== "undefined" ? selectedPrio : null;
}

/* --------------------------- Validation --------------------------------- */

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

function collectSubtasksFromUI() {
  return Array.from(document.querySelectorAll(".subtaskTitle"))
    .map((el) => el.textContent.trim())
    .filter(Boolean);
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

/* ------------------------------ UX -------------------------------------- */

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

function animateToastIn(msg) {
  requestAnimationFrame(() => {
    msg.style.transform = "translate(-50%, -50%)";
  });
}

function showAddedToastAndRedirect() {
  const msg = createToastMessage();
  animateToastIn(msg);
  setTimeout(() => {
    msg.remove();
    location.href = "board.html";
  }, 900);
}

/* ------------------------------ Create Task ----------------------------- */

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

function resetPrioUI() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont"));
  document.querySelectorAll(".prioGrade .prioImage").forEach((el) => el.classList.remove("filterWhite"));
  selectedPrio = "";
}

function resetCategoryUI() {
  selectedCategory = "";
  const ph = document.getElementById("categoryPlaceholder");
  if (ph) ph.textContent = "Select task category";
  document.getElementById("assignedToDropdownCategory")?.classList.remove("selected-red");
  document.querySelectorAll("#dropdown-list-category input[type='checkbox']").forEach((cb) => (cb.checked = false));
}

function resetAssignedUI() {
  window.assignedContacts = [];
  selectedContact = "";
  const initials = document.getElementById("assignedToInitials");
  if (initials) initials.innerHTML = "";
  const span = document.querySelector("#assignedToDropdownContacts .dropdown-selected span");
  if (span) span.textContent = "Select contact";
}

/* ---------------------------- Clear Task -------------------------------- */

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

/* ----------------------------- Init ------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("add");
  if (b) b.onclick = handleAddOrEditTask;
  initialiseSavePrioImg?.();
  initContactsDropdown?.();
  initCategoryDropdown?.();
  loadContactsInAddTask?.();
});

/* ----------------------------- Exports ---------------------------------- */
window.createTask = window.createTask || createTask;
window.clearTask = window.clearTask || clearTask;
window.getSubtasksFromForm = window.getSubtasksFromForm || collectSubtasksFromUI;
window.setPrioColor = window.setPrioColor || setPrioColor;
