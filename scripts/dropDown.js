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

async function loadContactsInAddTask() {
  try {
    const contacts = await httpGetJson("contacts.json");
    const list = getElementById("dropdown-list-contacts");
    if (!contacts || !list) return;
    window.loadedContacts = contacts;
    window.allContacts = Object.values(contacts)
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    renderContacts(window.allContacts, contacts);
  } catch (e) {
    console.error("Could not load contacts:", e);
  }
}

// ----------------------------------------dropDownMenue--------------------------------------------------

initDropDownMenue()

function initDropDownMenue() {
  let assignedToDropDownContacts = document.getElementById('assignedToDropdownContacts')
  let assignedToDropdownCategory = document.getElementById('assignedToDropdownCategory')

  assignedToDropDownContacts.addEventListener("click", openAssignedToContacts)
  assignedToDropdownCategory.addEventListener("click", openCategoryDropDown)

  if (document.getElementById('task-overlay-panel')) {
    let addTaskOverlayPanel = document.getElementById('task-overlay-panel')
    addTaskOverlayPanel.addEventListener("click", resetDropDown)
  } else {
    let htmlDiv = document.getElementById('htmlDiv')
    htmlDiv.addEventListener("click", resetDropDown)
  }
}

function openAssignedToContacts(event) {
  let assignedToDropDownContacts = document.getElementById('assignedToDropdownContacts')
  let dropDownArrow = document.getElementById('dropdown-arrow-contacts')
  event.stopPropagation();

  if (!assignedToDropDownContacts.classList.contains('open')) {
    resetDropDown("category")
    assignedToDropDownContacts.classList.add('open')
    addMarginSpacingForDropDownMenue("contacts")
    rotateArrowDropDown(dropDownArrow)
  } else {
    resetDropDown()
  }
}

function openCategoryDropDown(event) {
  let assignedToDropdownCategory = document.getElementById('assignedToDropdownCategory')
  let dropDownArrow = document.getElementById('dropdown-arrow-subtasks')
  event.stopPropagation();
  // resetDropDown()
  if (!assignedToDropdownCategory.classList.contains('open')) {
    resetDropDown("contacts")
    assignedToDropdownCategory.classList.add('open')
    resetMargin("category")
    addMarginSpacingForDropDownMenue("category")
    rotateArrowDropDown(dropDownArrow)
  } else {
    resetDropDown()
  }
}

function rotateArrowDropDown(dropDownArrow) {
  dropDownArrow.style.transform = "rotate(180deg) translateY(50%)"
}

function resetDropDown() {
  resetDropDownMenues()
  resetDropDownArrow()
  resetMargin()
}

function resetDropDownMenues(element) {
  let assignedToDropDownContacts = document.getElementById('assignedToDropdownContacts')
  let assignedToDropdownCategory = document.getElementById('assignedToDropdownCategory')
  if (element == "category") {
    assignedToDropdownCategory.classList.remove('open')
  } else if (element == "contacts") {
    assignedToDropDownContacts.classList.remove('open')
  } else {
    assignedToDropdownCategory.classList.remove('open')
    assignedToDropDownContacts.classList.remove('open')
  }

}

function resetDropDownArrow() {
  let dropDownArrowContacts = document.getElementById('dropdown-arrow-subtasks')
  let dropDownArrowAssignedTo = document.getElementById('dropdown-arrow-contacts')
  dropDownArrowContacts.style = ""
  dropDownArrowAssignedTo.style = ""
}

function addMarginSpacingForDropDownMenue(htmlElement) {
  let subTasks = document.getElementById('subtasks')
  let dropdownListCategory = document.getElementById('dropdown-list-category')
  let category = document.getElementById('category')
  let dropdownListContacts = document.getElementById('dropdown-list-contacts')
  if (htmlElement == "category") {
    subTasks.style.marginTop = dropdownListCategory.offsetHeight + (dropdownListCategory.offsetHeight * 0.1) + "px"
  } else if (htmlElement == "contacts") {
    category.style.marginTop = dropdownListContacts.offsetHeight + (dropdownListContacts.offsetHeight * 0.1) + "px"
  }
}

function resetMargin(element) {
  let category = document.getElementById('category')
  let subTasks = document.getElementById('subtasks')
  if (element == "category") {
    category.style.marginTop = "";
  } else if (element == "contacts") {
    subTasks.style.marginTop = "";
  } else {
    subTasks.style.marginTop = "";
    category.style.marginTop = "";
  }
}