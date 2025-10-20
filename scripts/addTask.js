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
document.addEventListener("DOMContentLoaded", () => {
  const b = document.getElementById("add");
  if (b) b.onclick = handleAddOrEditTask;
});

async function createTask() {
  clearInlineErrors();
  if (!validateTaskFormFields()) return;
  const b = document.getElementById("add");
  b?.setAttribute("disabled", true);
  try {
    await persistTask(buildTaskPayloadFromForm());
    showAddedToastAndRedirect();
  } catch (e) {
    console.error(e);
    alert("Die Aufgabe konnte nicht gespeichert werden.");
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
      alert("Konnte Änderung nicht speichern.");
    });
  } else {
    createTask();
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

/* --------------------------- Kontakte / Suche ---------------------------- */

async function loadContacts() {
  if (typeof loadContactsInAddTask === "function") await loadContactsInAddTask();
}

function initContactsDropdownInput() {
  const sel = $id("assignedToDropdownContacts"),
    arrow = $id("dropdown-arrow-contacts"),
    drop = $id("dropdown-list-contacts");
  if (!sel || !arrow || !drop) return;
  let open = false;

  const toggle = (show) => {
    drop.style.display = show ? "block" : "none";
    arrow.style.transform = `translateY(-50%) rotate(${show ? 180 : 0}deg)`;
    open = show;
  };

  sel.addEventListener("click", (e) => (e.stopPropagation(), toggle(!open)));
  document.addEventListener("click", () => open && toggle(false));

  drop.querySelectorAll(".dropdown-item-contact").forEach((it) =>
    it.addEventListener("click", (e) => {
      e.stopPropagation();
      const c = { id: it.dataset.id, name: it.dataset.name };
      if (!window.assignedContacts.some((x) => x.id === c.id)) window.assignedContacts.push(c);
      const initials = $id("assignedToInitials");
      if (initials) {
        initials.style.display = "block";
        initials.textContent = window.assignedContacts.map((x) => x.name[0]).join(", ");
      }
      toggle(false);
    })
  );
}

/* ---------------------------- Datepicker UX ------------------------------ */

function initDateMinAndPicker() {
  const input = $id("date");
  if (!input) return;

  input.min = new Date().toISOString().split("T")[0];

  input.addEventListener("click", () => {
    try {
      const ua = navigator.userActivation;
      const canShow = ua?.isActive || ua?.hasBeenActive;
      input.showPicker?.call && canShow ? input.showPicker() : input.focus();
    } catch {
      input.focus();
    }
  });
}

/* ----------------------------- Live Search ------------------------------- */

function initContactSearch() {
  const search = $id("contactSearch"),
    drop = $id("dropdown-list-contacts");
  if (!search || !drop) return;

  const toggle = (show) => (drop.style.display = show ? "block" : "none");
  const filterContacts = (q) => window.allContacts.filter((n) => n.toLowerCase().includes(q));

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase().trim(),
      results = filterContacts(q);
    if (window.loadedContacts) renderContacts(results, window.loadedContacts);
    toggle(q && results.length);
  });

  document.addEventListener("click", (e) => {
    if (!drop.contains(e.target) && e.target !== search) toggle(false);
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
