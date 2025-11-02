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

initDropDownMenue();

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

function openCategoryDropDown(event) {
  let assignedToDropdownCategory = document.getElementById("assignedToDropdownCategory");
  let dropDownArrow = document.getElementById("dropdown-arrow-subtasks");
  event.stopPropagation();
  // resetDropDown()
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

function rotateArrowDropDown(dropDownArrow) {
  dropDownArrow.style.transform = "rotate(180deg) translateY(50%)";
}

function resetDropDown() {
  resetDropDownMenues();
  resetDropDownArrow();
  resetMargin();
  document.getElementById("assignedToInitials").style.display = "flex";
}

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

function resetDropDownArrow() {
  let dropDownArrowContacts = document.getElementById("dropdown-arrow-subtasks");
  let dropDownArrowAssignedTo = document.getElementById("dropdown-arrow-contacts");
  dropDownArrowContacts.style = "";
  dropDownArrowAssignedTo.style = "";
}

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
 * Renders the contact list dropdown UI.
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
 * Creates a list item for one contact in the dropdown list.
 */
function createContactListItem(contact) {
  const li = makeLi();
  const label = makeLabel(contact);
  onEvent(li, "click", (e) => handleContactClick(e, contact));
  li.appendChild(label);
  return li;
}

function makeLi() {
  const li = document.createElement("div");
  li.className = "dropdown-item-contact";
  return li;
}

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
 * Toggles a contact in the selected list and updates UI.
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
 * Highlights selected contacts inside the dropdown list.
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
 * Renders up to 3 selected contacts as colored initials.
 */
function renderAssignedContacts() {
  const box = getElementById("assignedToInitials");
  if (!box) return;
  const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : [];
  setInnerHTML(box, "");
  if (!names.length) return; //hideElement(box);
  // showElement(box, "flex");
  addInitials(box, names.slice(0, 3));
  addOverflowCount(box, names);
}

function addInitials(box, names) {
  names.forEach((name) => {
    const item = document.createElement("span");
    item.className = "contact-initial";
    item.textContent = initials(name);
    item.style.backgroundColor = colorForName(name);
    box.appendChild(item);
  });
}

function addOverflowCount(box, names) {
  if (names.length <= 3) return;
  const extra = document.createElement("span");
  extra.className = "contact-initial more-count";
  extra.textContent = `+${names.length - 3}`;
  extra.style.backgroundColor = "#999";
  box.appendChild(extra);
}

function getAssignedList() {
  return Array.isArray(window.assignedContacts) ? window.assignedContacts : (window.assignedContacts = []);
}

function toggleName(list, name) {
  const i = list.indexOf(name);
  i >= 0 ? list.splice(i, 1) : list.push(name);
}

function handleContactClick(e, contact) {
  e.stopPropagation();
  toggleContact(contact.name);
  updateDropdownHighlight();
}

document.addEventListener("DOMContentLoaded", () => {
  loadContactsInAddTask();
});

function saveSelectedCategory(event, index) {
  event.stopPropagation();
  let placeHolder = document.getElementById("categoryPlaceholder");
  if (index == 0) {
    placeHolder.innerHTML = "Userstory";
  } else {
    placeHolder.innerHTML = "Technical Task";
  }
  resetDropDown();
}
