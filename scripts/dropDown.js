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
}


function openAssignedToContacts(event) {
  let dropDownArrow = event.currentTarget.children[0].children[1]
  rotateArrowDropDown(dropDownArrow)
}

function openCategoryDropDown() {
  return console.log('category')
}

function rotateArrowDropDown(dropDownArrow) {
  
}
