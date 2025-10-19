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

function $(s) {
  return document.querySelector(s);
}

function clearFormInputs() {
  ["#titleInput", "#descriptionInput", "#date", "#subtaskInput"].forEach((s) => {
    const el = $(s);
    if (el) el.value = "";
  });
}

function hideFormErrors() {
  document.querySelectorAll(".addTaskErrors").forEach((e) => {
    e.style.visibility = "hidden";
  });
}

function resetFieldBorders() {
  const selectors = ["#titleInput", "#descriptionInput", "#date", "#assignedToDropdownContacts", "#assignedToDropdownCategory"];
  selectors.forEach((s) => {
    const el = $(s);
    if (el) el.style.border = "";
  });
}

function resetUISections() {
  if (typeof resetPrioUI === "function") resetPrioUI();
  if (typeof resetCategoryUI === "function") resetCategoryUI();
  if (typeof resetAssignedUI === "function") resetAssignedUI();
}

function clearSubtasks() {
  const wrapper = $(".addedSubtaskWrapper");
  if (wrapper) wrapper.innerHTML = "";

  const imgContainer = $(".subtask-images-container");
  if (imgContainer) imgContainer.style.display = "none";
}

function resetContactDropdown() {
  const search = document.getElementById("contactSearch");
  if (search) search.value = "";

  const dropdown = document.getElementById("dropdown-list-contacts");
  if (dropdown) dropdown.style.display = "none";

  const arrow = document.getElementById("dropdown-arrow-contacts");
  if (arrow) arrow.style.transform = "translateY(-50%) rotate(0deg)";
}

function rerenderContactsIfLoaded() {
  if (window.loadedContacts && typeof renderContacts === "function") {
    renderContacts(window.allContacts, window.loadedContacts);
  }
}
