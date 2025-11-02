/**
 * Fetches all tasks from the database.
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
 */
async function saveTask(path, data) {
  return httpPostJson(path + ".json", data);
}

// ----------------------------------------dropDownMenue--------------------------------------------------

/**
 * Initializes dropdown menus for contacts and categories.
 *
 * - Binds click event listeners to open contact/category dropdowns.
 * - Binds click event on overlay or HTML container to reset dropdowns.
 *
 * @function initDropDownMenue
 * @returns {void}
 */
function initDropDownMenue() {
  let assignedToDropDownContacts = document.getElementById("assignedToDropdownContacts");
  let assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  assignedToDropDownContacts.addEventListener("click", openAssignedToContacts);
  assignedToDropdownCategory.addEventListener("click", openCategoryDropDown);
  if (document.getElementById("task-overlay-panel")) {
    let addTaskOverlayPanel = document.getElementById("task-overlay-panel");
    addTaskOverlayPanel.addEventListener("click", resetDropDown);
  } else {
    let htmlDiv = document.getElementById("htmlDiv");
    htmlDiv.addEventListener("click", resetDropDown);
  }
}

/**
 * Opens or closes the "Assigned To" contacts dropdown.
 *
 * @function openAssignedToContacts
 * @param {MouseEvent} event - The click event triggering the function.
 * @returns {void}
 */
function openAssignedToContacts(event) {
  let assignedToDropDownContacts = document.getElementById("assignedToDropdownContacts");
  let dropDownArrow = document.getElementById("dropdown-arrow-contacts");
  let dropdownList = document.getElementById("dropdown-list-contacts");
  event.stopPropagation();
  if (!assignedToDropDownContacts.classList.contains("open")) {
    resetDropDown("category");
    document.getElementById("assignedToInitials").style.display = "none";
    assignedToDropDownContacts.classList.add("open");
    dropdownList.classList.add("open");
    addMarginSpacingForDropDownMenue("contacts");
    rotateArrowDropDown(dropDownArrow);
  } else {
    resetDropDown();
  }
}

/**
 * Opens or closes the category dropdown.
 *
 * @function openCategoryDropDown
 * @param {MouseEvent} event - The click event triggering the function.
 * @returns {void}
 */
function openCategoryDropDown(event) {
  let assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  let dropDownArrow = document.getElementById("dropdown-arrow-subtasks");
  event.stopPropagation();
  if (!assignedToDropdownCategory.classList.contains("open")) {
    resetDropDown("contacts");
    assignedToDropdownCategory.classList.add("open");
    resetMargin("category");
    addMarginSpacingForDropDownMenue("category");
    rotateArrowDropDown(dropDownArrow);
  } else {
    resetDropDown();
  }
}

/**
 * Rotates a dropdown arrow icon to indicate the menu is open.
 *
 * @function rotateArrowDropDown
 * @param {HTMLElement} dropDownArrow - The arrow element to rotate.
 * @returns {void}
 */
function rotateArrowDropDown(dropDownArrow) {
  dropDownArrow.style.transform = "rotate(180deg) translateY(50%)";
}

/**
 * Resets all dropdown menus, arrows, and margin adjustments to default state.
 *
 * @function resetDropDown
 * @returns {void}
 */
function resetDropDown() {
  resetDropDownMenues();
  resetDropDownArrow();
  resetMargin();
  document.getElementById("assignedToInitials").style.display = "flex";
}

/**
 * Closes dropdown menus based on the given element type.
 *
 * @function resetDropDownMenues
 * @param {"category"|"contacts"} [element] - The dropdown type to reset.
 * @returns {void}
 */
function resetDropDownMenues(element) {
  let assignedToDropDownContacts = document.getElementById("assignedToDropdownContacts");
  let assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  if (element == "category") {
    assignedToDropdownCategory.classList.remove("open");
  } else if (element == "contacts") {
    assignedToDropDownContacts.classList.remove("open");
  } else {
    assignedToDropdownCategory.classList.remove("open");
    assignedToDropDownContacts.classList.remove("open");
  }
}

/**
 * Resets the styles of dropdown arrow icons.
 *
 * @function resetDropDownArrow
 * @returns {void}
 */
function resetDropDownArrow() {
  let dropDownArrowContacts = document.getElementById("dropdown-arrow-subtasks");
  let dropDownArrowAssignedTo = document.getElementById("dropdown-arrow-contacts");
  dropDownArrowContacts.style = "";
  dropDownArrowAssignedTo.style = "";
}

/**
 * Adds margin spacing below dropdowns to prevent overlapping with other elements.
 *
 * @function addMarginSpacingForDropDownMenue
 * @param {"category"|"contacts"} htmlElement - Determines which element's margin to adjust.
 * @returns {void}
 */
function addMarginSpacingForDropDownMenue(htmlElement) {
  let subTasks = document.getElementById("subtasks");
  let dropdownListCategory = document.getElementById("dropdown-list-category");
  let category = document.getElementById("category");
  let dropdownListContacts = document.getElementById("dropdown-list-contacts");
  if (htmlElement == "category") {
    subTasks.style.marginTop = dropdownListCategory.offsetHeight + dropdownListCategory.offsetHeight * 0.1 + "px";
  } else if (htmlElement == "contacts") {
    category.style.marginTop = dropdownListContacts.offsetHeight + dropdownListContacts.offsetHeight * 0.05 + "px";
  }
}

/**
 * Resets element margins modified by dropdowns.
 *
 * @function resetMargin
 * @param {"category"|"contacts"} [element] - The specific element to reset margins for.
 * @returns {void}
 */
function resetMargin(element) {
  let category = document.getElementById("category");
  let subTasks = document.getElementById("subtasks");
  if (element == "category") {
    category.style.marginTop = "";
  } else if (element == "contacts") {
    subTasks.style.marginTop = "";
  } else {
    subTasks.style.marginTop = "";
    category.style.marginTop = "";
  }
}

/**
 * Renders the contact list inside the dropdown menu.
 *
 * @function renderContacts
 * @param {string[]} names - Array of contact names.
 * @param {Object.<string, {name: string}>} contacts - Object containing contact data.
 * @returns {void}
 */
function renderContacts(names, contacts) {
  const list = getElementById("dropdown-list-contacts");
  if (!list) return;
  setInnerHTML(list, "");
  names.forEach((name) => {
    const entry = Object.values(contacts).find((c) => c.name === name);
    if (entry) list.appendChild(createContactListItem(entry));
  });
}

/**
 * Creates a list item element for a single contact.
 *
 * @function createContactListItem
 * @param {{name: string}} contact - Contact object containing name data.
 * @returns {HTMLDivElement} The generated contact list item element.
 */
function createContactListItem(contact) {
  const li = makeLi();
  const label = makeLabel(contact);
  onEvent(li, "click", (e) => handleContactClick(e, contact));
  li.appendChild(label);
  return li;
}

/**
 * Creates a basic container element for a contact dropdown item.
 *
 * @function makeLi
 * @returns {HTMLDivElement} A new div element for a contact item.
 */
function makeLi() {
  const li = document.createElement("div");
  li.className = "dropdown-item-contact";
  return li;
}

/**
 * Builds a label element for a contact with name, initials, and checkbox image.
 *
 * @function makeLabel
 * @param {{name: string}} contact - Contact data.
 * @returns {HTMLLabelElement} A label element with contact info and checkbox.
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
  img.src = (window.assignedContacts || []).includes(contact.name) ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";
  label.append(av, nm, img);
  return label;
}

/**
 * Toggles a contact selection and updates the dropdown display.
 *
 * @function toggleContact
 * @param {string} name - Name of the contact to toggle.
 * @returns {void}
 */
function toggleContact(name) {
  const list = getAssignedList();
  toggleName(list, name);
  const dd = getElementById("assignedToDropdownContacts");
  const isOpen = dd?.classList.contains("open");
  const before = isOpen && window.__categoryBox ? window.__categoryBox.offsetTop : 0;
  renderAssignedContacts();
  updateDropdownHighlight();
}

/**
 * Updates the UI highlight state for contacts inside the dropdown.
 *
 * @function updateDropdownHighlight
 * @returns {void}
 */
function updateDropdownHighlight() {
  const list = getElementById("dropdown-list-contacts");
  if (!list) return;
  querySelectorAll("label.dropdown-checkbox", list).forEach((label) => {
    const name = querySelector("span.contact-name", label)?.textContent?.trim() || "";
    const img = querySelector("img.checkbox-svg", label);
    const sel = window.assignedContacts?.includes(name);
    const item = label.closest(".dropdown-item-contact");
    if (img) {
      img.src = sel ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";
      img.classList.toggle("checked", sel);
    }
    label.style.color = sel ? "white" : "";
    if (item) item.classList.toggle("selected", sel);
  });
}

/**
 * Displays up to 3 selected contacts as colored initials in the UI.
 *
 * @function renderAssignedContacts
 * @returns {void}
 */
function renderAssignedContacts() {
  const box = getElementById("assignedToInitials");
  if (!box) return;
  const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : [];
  setInnerHTML(box, "");
  if (!names.length) return;
  addInitials(box, names.slice(0, 3));
  addOverflowCount(box, names);
}

/**
 * Adds colored initials for selected contacts in the UI.
 *
 * @function addInitials
 * @param {HTMLElement} box - The container element to append initials into.
 * @param {string[]} names - List of contact names.
 * @returns {void}
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
 * Adds an overflow counter (+N) when more than 3 contacts are selected.
 *
 * @function addOverflowCount
 * @param {HTMLElement} box - The container element to append the counter into.
 * @param {string[]} names - Array of selected contact names.
 * @returns {void}
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
 * Retrieves or initializes the global assigned contacts list.
 *
 * @function getAssignedList
 * @returns {string[]} The array of assigned contact names.
 */
function getAssignedList() {
  return Array.isArray(window.assignedContacts) ? window.assignedContacts : (window.assignedContacts = []);
}

/**
 * Toggles a contact name within a contact list.
 *
 * @function toggleName
 * @param {string[]} list - Array of contact names.
 * @param {string} name - Name of the contact to toggle.
 * @returns {void}
 */
function toggleName(list, name) {
  const i = list.indexOf(name);
  i >= 0 ? list.splice(i, 1) : list.push(name);
}

/**
 * Handles contact item click events to toggle selection.
 *
 * @function handleContactClick
 * @param {MouseEvent} e - The click event.
 * @param {{name: string}} contact - The clicked contact.
 * @returns {void}
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
 *
 * @function saveSelectedCategory
 * @param {MouseEvent} event - The click event.
 * @param {number} index - Index of the selected category (0 = Userstory, 1 = Technical Task).
 * @returns {void}
 */
function saveSelectedCategory(event, index) {
  event.stopPropagation();
  let placeHolder = document.getElementById("categoryPlaceholder");
  let categories = ["Userstory", "Technical Task"];
  window.selectedCategory = categories[index];
  placeHolder.innerHTML = index === 0 ? "Userstory" : "Technical Task";
  resetDropDown();
}
