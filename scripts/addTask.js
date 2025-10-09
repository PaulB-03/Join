const baseURL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

let prioGrade = "";
let selectedPrio = "";
let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
window.assignedContacts = window.assignedContacts || [];

/* ----------------------------- UI-Helpers ------------------------------ */

function $id(id) {
  return document.getElementById(id);
}

function getFieldValue(id) {
  const el = $id(id);
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
    const field = $id(id);
    if (field) field.style.border = "";
  });
}

/* --------------------------- Prio-Auswahl ------------------------------ */

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

/* --------------------------- Validierung -------------------------------- */

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

/* ----------------------------- API Calls -------------------------------- */

async function persistTask(payload) {
  const res = await fetch(`${baseURL}tasks.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("POST /tasks failed: " + res.status);
  return res.json();
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

/* ------------------------------ Create ---------------------------------- */

async function createTask() {
  clearInlineErrors();

  if (!validateTaskFormFields()) return;

  const payload = buildTaskPayloadFromForm();
  const btn = document.getElementById("add");
  if (btn) btn.disabled = true;

  try {
    const savedTask = await persistTask(payload);
    showAddedToastAndRedirect();
  } catch (e) {
    alert("Die Aufgabe konnte nicht gespeichert werden.");
    console.error(e);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function selectContact(contact) {
  if (!contact) return;

  if (!window.assignedContacts.some((c) => c.id === contact.id)) {
    window.assignedContacts.push(contact);
  }

  const initials = document.getElementById("assignedToInitials");
  if (initials) initials.textContent = window.assignedContacts.map((c) => c.name[0]).join(", ");
}

/* ------------------------ Subtasks (Overlay-Form) ------------------------ */

function getSubtasksFromForm() {
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  if (!wrapper) return [];
  return Array.from(wrapper.querySelectorAll(".subtask, .subtaskTitle"))
    .map((el) => {
      const text = el.textContent.trim();
      if (!text) return null;
      const done = el.querySelector?.("input[type=checkbox]")?.checked || false;
      return { text, done };
    })
    .filter(Boolean);
}

/* ---------------------------- Formular Reset ----------------------------- */

function resetPrioUI() {
  document.querySelectorAll(".prioGrade").forEach((el) => el.classList.remove("isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont"));
  document.querySelectorAll(".prioGrade .prioImage").forEach((el) => el.classList.remove("filterWhite"));
  selectedPrio = "";
}

function resetCategoryUI() {
  selectedCategory = "";
  const ph = $id("categoryPlaceholder");
  if (ph) ph.textContent = "Select task category";
  $id("assignedToDropdownCategory")?.classList.remove("selected-red");
  const list = document.querySelectorAll("#dropdown-list-category input[type='checkbox']");
  list.forEach((cb) => (cb.checked = false));
}

function resetAssignedUI() {
  window.assignedContacts = [];
  selectedContact = "";
  const initials = document.getElementById("assignedToInitials");
  if (initials) initials.innerHTML = "";
  const span = document.querySelector("#assignedToDropdownContacts .dropdown-selected span");
  if (span) span.textContent = "Select contact";
  // Removed: Clearing the list.innerHTML to preserve dropdown options after reset
}

function clearTask() {
  ["#titleInput", "#descriptionInput", "#date"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });

  const subInput = document.getElementById("subtaskInput");
  if (subInput) subInput.value = "";

  document.querySelectorAll(".addTaskErrors").forEach((e) => (e.style.visibility = "hidden"));
  ["#titleInput", "#descriptionInput", "#date", "#assignedToDropdownContacts", "#assignedToDropdownCategory"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.style.border = "";
  });

  resetPrioUI();
  resetCategoryUI();
  resetAssignedUI();

  const subWrap = document.querySelector(".addedSubtaskWrapper");
  if (subWrap) subWrap.innerHTML = "";

  const imgC = document.querySelector(".subtask-images-container");
  if (imgC) imgC.style.display = "none";

  // Additional: Fully clear contacts selection visuals and state
  const search = document.getElementById("contactSearch");
  if (search) search.value = ""; // Clear search input to reset filtering

  const dropdown = document.getElementById("dropdown-list-contacts");
  if (dropdown) dropdown.style.display = "none"; // Ensure dropdown is closed

  const arrow = document.getElementById("dropdown-arrow-contacts");
  if (arrow) arrow.style.transform = "translateY(-50%) rotate(0deg)"; // Reset arrow

  // Re-render full contacts list to reset any prior filtering (if loaded)
  if (window.loadedContacts && typeof renderContacts === "function") {
    renderContacts(window.allContacts, window.loadedContacts);
  }
}

/* --------------------------- Kontakte / Suche ---------------------------- */

async function loadContacts() {
  if (typeof loadContactsInAddTask === "function") await loadContactsInAddTask();
}

function initContactsDropdownInput() {
  const select = $id("assignedToDropdownContacts");
  const arrow = $id("dropdown-arrow-contacts");
  const drop = $id("dropdown-list-contacts");
  if (!select || !arrow || !drop) return;

  let isOpen = false;
  select.addEventListener("click", (ev) => {
    ev.stopPropagation();
    isOpen = !isOpen;
    drop.style.display = isOpen ? "block" : "none";
    arrow.style.transform = isOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
  });

  document.addEventListener("click", () => {
    if (!isOpen) return;
    drop.style.display = "none";
    arrow.style.transform = "translateY(-50%) rotate(0deg)";
    isOpen = false;
  });

  Array.from(drop.getElementsByClassName("dropdown-item-contact")).forEach((item) => {
    item.addEventListener("click", (ev) => {
      ev.stopPropagation();

      const contact = { id: item.dataset.id, name: item.dataset.name };
      if (!window.assignedContacts.some((c) => c.id === contact.id)) {
        window.assignedContacts.push(contact);
      }

      const initials = document.getElementById("assignedToInitials");
      if (initials) {
        initials.style.display = "block"; // show div
        initials.textContent = window.assignedContacts.map((c) => c.name[0]).join(", ");
      }

      drop.style.display = "none";
      const arrow = document.getElementById("dropdown-arrow-contacts");
      if (arrow) arrow.style.transform = "translateY(-50%) rotate(0deg)";
    });
  });
}

/* ---------------------------- Datepicker UX ------------------------------ */

function initDateMinAndPicker() {
  const input = $id("date");
  if (!input) return;
  input.min = new Date().toISOString().split("T")[0];
  const open = (e) => {
    try {
      const ua = navigator.userActivation;
      const ok = ua && (ua.isActive || ua.hasBeenActive);
      if (typeof input.showPicker === "function" && ok) {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  };

  input.addEventListener("click", open);
}

/* ----------------------------- Live Search ------------------------------- */

function initContactSearch() {
  const search = document.getElementById("contactSearch");
  const dropdown = document.getElementById("dropdown-list-contacts");
  if (!search || !dropdown) return;

  search.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();
    const filtered = window.allContacts.filter((name) => name.toLowerCase().includes(query));

    if (window.loadedContacts) {
      renderContacts(filtered, window.loadedContacts);
    }

    // Show dropdown if there is input, hide if empty
    if (query.length > 0 && filtered.length > 0) {
      dropdown.style.display = "block"; // or remove "hidden" class if you use Tailwind/bootstrap style
    } else {
      dropdown.style.display = "none"; // hide if nothing matches or input is empty
    }
  });

  // Optional: hide dropdown if user clicks outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== search) {
      dropdown.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", initContactSearch);

/* ------------------------------ Bootstraps ------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initDateMinAndPicker();
  initContactsDropdownInput();
  initContactSearch();
  loadContacts();
});

/* ------------------------------ Exports ---------------------------------- */

window.createTask = window.createTask || createTask;
window.clearTask = window.clearTask || clearTask;
window.getSubtasksFromForm = window.getSubtasksFromForm || getSubtasksFromForm;
window.setPrioColor = window.setPrioColor || setPrioColor;

const CategoryDropdown = (() => {
  // === Helpers ===
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, evt, fn) => el?.addEventListener(evt, fn);

  // === Core Select Logic ===
  const categories = ["User  story", "Technical Task"];

  function selectCategory(index) {
    const dd = $("assignedToDropdownCategory");
    const ph = $("categoryPlaceholder");
    const inputs = $$("input[name='category']");
    const category = categories[index];

    window.selectedCategory = category;
    if (ph) ph.textContent = category;
    dd?.classList.add("selected-red");

    inputs.forEach((input, i) => (input.checked = i === index));

    dd.style.border = "";
    const nextEl = dd.nextElementSibling;
    if (nextEl && nextEl.classList.contains("error-message")) {
      nextEl.remove();
    }

    if (typeof resetSubtasksSpacing === "function") resetSubtasksSpacing();
  }

  function saveSelectedCategory(index) {
    selectCategory(index);
    closeDropdown();
  }
  let open = false;

  function toggleDropdown() {
    open ? closeDropdown() : openDropdown();
  }

  function openDropdown() {
    const dd = $("assignedToDropdownCategory");
    const arrow = $("dropdown-arrow-subtasks");
    open = true;
    dd?.classList.add("open");
    if (arrow) arrow.style.transform = "translateY(-50%) rotate(180deg)";
    dd?.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    const dd = $("assignedToDropdownCategory");
    const arrow = $("dropdown-arrow-subtasks");
    open = false;
    dd?.classList.remove("open");
    if (arrow) arrow.style.transform = "translateY(-50%) rotate(0deg)";
    dd?.setAttribute("aria-expanded", "false");
  }

  function init() {
    const dd = $("assignedToDropdownCategory");
    const list = $("dropdown-list-category");
    if (!dd || !list) return;

    on(dd, "click", (ev) => {
      ev.stopPropagation();
      toggleDropdown();
    });

    on(dd, "keydown", (ev) => {
      if (["Enter", " "].includes(ev.key)) {
        ev.preventDefault();
        toggleDropdown();
      } else if (ev.key === "Escape") {
        closeDropdown();
      }
    });

    $$(".dropdown-item-category", list).forEach((item, idx) => {
      on(item, "click", (ev) => {
        ev.stopPropagation();
        selectCategory(idx);
        closeDropdown();
      });
    });

    on(document, "click", () => {
      if (open) closeDropdown();
    });

    window.saveSelectedCategory = saveSelectedCategory;
  }
  return { init, selectCategory, saveSelectedCategory };
})();

document.addEventListener("DOMContentLoaded", CategoryDropdown.init);

const textarea = document.getElementById("descriptionInput");
const handle = document.querySelector(".resize-handle");

if (textarea && handle) {
  let isResizing = false;
  let startY, startHeight;

  handle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = parseInt(getComputedStyle(textarea).height, 10);
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
    e.preventDefault();
  });

  function resize(e) {
    if (!isResizing) return;
    const deltaY = e.clientY - startY;
    let newHeight = startHeight + deltaY;

    const minHeight = parseInt(getComputedStyle(textarea).minHeight, 10);
    const maxHeight = parseInt(getComputedStyle(textarea).maxHeight, 10);
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

    textarea.style.height = newHeight + "px";
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }
}

//document.addEventListener("DOMContentLoaded", () => {
//  const dateInput = document.getElementById("date");
//  if (!dateInput) return;
//
//  dateInput.addEventListener("input", (e) => {
//    let val = dateInput.value.replace(/\D/g, "");
//    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
//    if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5, 9);
//    dateInput.value = val;
//  });
//});

//flatpickr("#date", {
//  dateFormat: "d/m/Y",
//  locale: "en",
//  allowInput: true,
//  minDate: "today",
//  onClose: validateFutureDate,
//});

function validateFutureDate(_, dateStr, instance) {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const typedDate = new Date(`${y}-${m}-${d}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isNaN(typedDate) && typedDate >= today) {
      instance.setDate(typedDate, true); // keep typed date
    } else {
      instance.clear();
    }
  } else {
    instance.clear();
  }
}
