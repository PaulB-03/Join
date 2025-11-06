/**
 * Fetches all tasks from the database.
 * @async
 * @returns {Promise<Object|null>} The task data object or null if fetching fails.
 */
async function getTasks() {
  try {
    return (await httpGetJson("tasks.json")) || {};
  } catch (err) {
    console.error("Could not get tasks:", err);
    return null;
  }
}

/**
 * Saves a task to the database under the given path.
 * @async
 * @param {string} path - The database path to save the task.
 * @param {Object} data - The task data to save.
 * @returns {Promise<any>} The response from the POST request.
 */
async function saveTask(path, data) {
  return httpPostJson(path + ".json", data);
}

document.addEventListener("DOMContentLoaded", () => {
  const contacts = document.getElementById("assignedToDropdownContacts");
  const category = document.getElementById("assignedToDropdownCategory");
  if (contacts || category) initDropDownMenue();
});

/**
 * Initializes event listeners for the dropdown menus.
 * Handles both the contacts and category dropdowns.
 */
function initDropDownMenue() {
  const assignedToDropDownContacts = document.getElementById("assignedToDropdownContacts");
  const assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  if (assignedToDropDownContacts) {
    assignedToDropDownContacts.addEventListener("click", openAssignedToContacts);
  }
  if (assignedToDropdownCategory) {
    assignedToDropdownCategory.addEventListener("click", openCategoryDropDown);
  }
  if (document.getElementById("task-overlay-panel")) {
    const addTaskOverlayPanel = document.getElementById("task-overlay-panel");
    addTaskOverlayPanel.addEventListener("click", resetDropDown);
  } else {
    const htmlDiv = document.getElementById("htmlDiv");
    if (htmlDiv) htmlDiv.addEventListener("click", resetDropDown);
  }
}

/**
 * Opens or closes the "Assigned To" contacts dropdown.
 * @param {MouseEvent} event - The click event.
 */
function openAssignedToContacts(event) {
  const assignedToDropDownContacts = document.getElementById("assignedToDropdownContacts");
  const dropDownArrow = document.getElementById("dropdown-arrow-contacts");
  const dropdownList = document.getElementById("dropdown-list-contacts");
  event.stopPropagation();
  if (!assignedToDropDownContacts.classList.contains("open")) {
    resetDropDown("category");
    const initialsBox = document.getElementById("assignedToInitials");
    if (initialsBox) initialsBox.style.display = "none";
    assignedToDropDownContacts.classList.add("open");
    if (dropdownList) dropdownList.classList.add("open");
    addMarginSpacingForDropDownMenue("contacts");
    if (dropDownArrow) rotateArrowDropDown(dropDownArrow);
  } else {
    resetDropDown();
  }
}

/**
 * Opens or closes the category dropdown.
 * @param {MouseEvent} event - The click event.
 */
function openCategoryDropDown(event) {
  const assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  const dropDownArrow = document.getElementById("dropdown-arrow-subtasks");
  event.stopPropagation();
  if (!assignedToDropdownCategory.classList.contains("open")) {
    resetDropDown("contacts");
    assignedToDropdownCategory.classList.add("open");
    resetMargin("category");
    addMarginSpacingForDropDownMenue("category");
    if (dropDownArrow) rotateArrowDropDown(dropDownArrow);
  } else {
    resetDropDown();
  }
}

/**
 * Rotates the dropdown arrow icon.
 * @param {HTMLElement} dropDownArrow - The arrow element to rotate.
 */
function rotateArrowDropDown(dropDownArrow) {
  dropDownArrow.style.transform = "rotate(180deg) translateY(50%)";
}

/**
 * Resets both dropdown menus and restores UI states.
 */
function resetDropDown() {
  resetDropDownMenues();
  resetDropDownArrow();
  resetMargin();
  const initialsBox = document.getElementById("assignedToInitials");
  if (initialsBox) initialsBox.style.display = "flex";
}

/**
 * Closes one or both dropdown menus.
 * @param {string} [element] - Optional. "category" or "contacts" to reset a specific dropdown.
 */
function resetDropDownMenues(element) {
  const assignedToDropDownContacts = document.getElementById("assignedToDropdownContacts");
  const assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  if (element === "category") {
    assignedToDropdownCategory?.classList.remove("open");
  } else if (element === "contacts") {
    assignedToDropDownContacts?.classList.remove("open");
  } else {
    assignedToDropdownCategory?.classList.remove("open");
    assignedToDropDownContacts?.classList.remove("open");
  }
}

/**
 * Resets dropdown arrow icons to their default state.
 */
function resetDropDownArrow() {
  const dropDownArrowContacts = document.getElementById("dropdown-arrow-subtasks");
  const dropDownArrowAssignedTo = document.getElementById("dropdown-arrow-contacts");
  if (dropDownArrowContacts) dropDownArrowContacts.style = "";
  if (dropDownArrowAssignedTo) dropDownArrowAssignedTo.style = "";
}

/**
 * Adjusts spacing between dropdown menus to prevent overlap.
 * @param {string} htmlElement - "category" or "contacts" indicating which dropdown was opened.
 */
function addMarginSpacingForDropDownMenue(htmlElement) {
  const subTasks = document.getElementById("subtasks");
  const dropdownListCategory = document.getElementById("dropdown-list-category");
  const category = document.getElementById("category");
  const dropdownListContacts = document.getElementById("dropdown-list-contacts");
  if (htmlElement === "category" && subTasks && dropdownListCategory) {
    subTasks.style.marginTop = dropdownListCategory.offsetHeight + dropdownListCategory.offsetHeight * 0.1 + "px";
  } else if (htmlElement === "contacts" && category && dropdownListContacts) {
    category.style.marginTop = dropdownListContacts.offsetHeight + dropdownListContacts.offsetHeight * 0.05 + "px";
  }
}

/**
 * Resets dropdown-related margins to their original state.
 * @param {string} [element] - Optional. "category" or "contacts" to reset specific spacing.
 */
function resetMargin(element) {
  const category = document.getElementById("category");
  const subTasks = document.getElementById("subtasks");
  if (element === "category" && category) {
    category.style.marginTop = "";
  } else if (element === "contacts" && subTasks) {
    subTasks.style.marginTop = "";
  } else {
    if (subTasks) subTasks.style.marginTop = "";
    if (category) category.style.marginTop = "";
  }
}

/**
 * Renders the contact list dropdown UI.
 * @param {string[]} names - List of contact names.
 * @param {Object} contacts - Object containing all contact details.
 */
function renderContacts(names, contacts) {
  const list = document.getElementById("dropdown-list-contacts");
  if (!list) return;
  list.innerHTML = "";
  names.forEach((name) => {
    const entry = Object.values(contacts).find((c) => c.name === name);
    if (entry) list.appendChild(createContactListItem(entry));
  });
}

/**
 * Creates a list item for one contact in the dropdown list.
 * @param {Object} contact - Contact object with name and color data.
 * @returns {HTMLElement} The generated list item element.
 */
function createContactListItem(contact) {
  const li = makeLi();
  const label = makeLabel(contact);
  li.addEventListener("click", (e) => handleContactClick(e, contact));
  li.appendChild(label);
  return li;
}

/**
 * Creates a <div> element for a dropdown contact item.
 * @returns {HTMLDivElement} The created div element.
 */
function makeLi() {
  const li = document.createElement("div");
  li.className = "dropdown-item-contact";
  return li;
}

/**
 * Builds the label structure for a contact dropdown item.
 * @param {Object} contact - The contact data.
 * @returns {HTMLLabelElement} The constructed label element.
 */
function makeLabel(contact) {
  const label = document.createElement("label");
  label.className = "dropdown-checkbox";
  const av = document.createElement("span");
  av.className = "contact-initial";
  av.textContent = initials(contact.name);
  av.style.backgroundColor = colorForName(contact.name);
  const nm = document.createElement("span");
  nm.className = "contact-name";
  nm.textContent = contact.name;
  const img = document.createElement("img");
  img.className = "checkbox-svg";
  img.src = (window.assignedContacts || []).includes(contact.name) ? "../assets/svg/checked.svg" : "../assets/svg/checkbox.svg";
  label.append(av, nm, img);
  return label;
}

/**
 * Toggles a contact in the selected list and updates UI.
 * @param {string} name - The contact's name.
 */
function toggleContact(name) {
  const list = getAssignedList();
  toggleName(list, name);
  const dd = document.getElementById("assignedToDropdownContacts");
  const isOpen = dd?.classList.contains("open");
  const before = isOpen && window.__categoryBox ? window.__categoryBox.offsetTop : 0;
  renderAssignedContacts();
  updateDropdownHighlight();
}

/**
 * Highlights selected contacts inside the dropdown list.
 */
function updateDropdownHighlight() {
  const list = document.getElementById("dropdown-list-contacts");
  if (!list) return;
  const labels = list.querySelectorAll("label.dropdown-checkbox");
  labels.forEach((label) => {
    const name = label.querySelector("span.contact-name")?.textContent?.trim() || "";
    const img = label.querySelector("img.checkbox-svg");
    const sel = window.assignedContacts?.includes(name);
    const item = label.closest(".dropdown-item-contact");
    if (img) {
      img.src = sel ? "../assets/svg/checked.svg" : "../assets/svg/checkbox.svg";
      img.classList.toggle("checked", !!sel);
    }
    label.style.color = sel ? "white" : "";
    if (item) item.classList.toggle("selected", !!sel);
  });
}

/**
 * Renders up to three selected contacts as colored initials.
 */
function renderAssignedContacts() {
  const box = document.getElementById("assignedToInitials");
  if (!box) return;
  const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : [];
  box.innerHTML = "";
  if (!names.length) return;
  addInitials(box, names.slice(0, 3));
  addOverflowCount(box, names);
}

/**
 * Appends up to three initials to the display box.
 * @param {HTMLElement} box - The container element.
 * @param {string[]} names - The selected contact names.
 */
function addInitials(box, names) {
  names.forEach((name) => {
    const item = document.createElement("span");
    item.className = "contact-initial";
    item.textContent = initials(name);
    item.style.backgroundColor = colorForName(name);
    box.appendChild(item);
  });
}

/**
 * Adds a "+X" indicator if more than three contacts are selected.
 * @param {HTMLElement} box - The container element.
 * @param {string[]} names - All selected contact names.
 */
function addOverflowCount(box, names) {
  if (names.length <= 3) return;
  const extra = document.createElement("span");
  extra.className = "contact-initial more-count";
  extra.textContent = `+${names.length - 3}`;
  extra.style.backgroundColor = "#999";
  box.appendChild(extra);
}

/**
 * Returns or initializes the global assigned contact list.
 * @returns {string[]} The list of assigned contact names.
 */
function getAssignedList() {
  return Array.isArray(window.assignedContacts) ? window.assignedContacts : (window.assignedContacts = []);
}

/**
 * Toggles a name inside the contact list (add/remove).
 * @param {string[]} list - The current contact list.
 * @param {string} name - The contact name to toggle.
 */
function toggleName(list, name) {
  const i = list.indexOf(name);
  i >= 0 ? list.splice(i, 1) : list.push(name);
}

/**
 * Handles the click event for a contact inside the dropdown.
 * @param {MouseEvent} e - The click event.
 * @param {Object} contact - The clicked contact.
 */
function handleContactClick(e, contact) {
  e.stopPropagation();
  toggleContact(contact.name);
  updateDropdownHighlight();
}

document.addEventListener("DOMContentLoaded", () => {
  loadContactsInAddTask();
});

/**
 * Saves the selected category and updates the placeholder text.
 * @param {MouseEvent} event - The click event.
 * @param {number} index - The selected category index (0 or 1).
 */
function saveSelectedCategory(event, index) {
  event.stopPropagation();
  const placeHolder = document.getElementById("categoryPlaceholder");
  const categories = ["Userstory", "Technical Task"];
  window.selectedCategory = categories[index];
  if (placeHolder) {
    placeHolder.innerHTML = index === 0 ? "Userstory" : "Technical Task";
  }
  resetDropDown();
}
