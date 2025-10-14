// filters tasks based on user input
async function findTask() {
  const input = document.getElementById("taskSearchInput"); // Get input field
  const query = input.value.trim(); // Get text and remove spaces
  const tooShort = query.length <= 1 || !isNaN(query); // Ignore if too short or numeric
  if (tooShort) { hideNoResults(); init(); return; } // Reset board if input invalid
  const tasks = await getTasks(); // Fetch all tasks
  const pool = changeObjectToArray(tasks); // Convert tasks to searchable strings
  const caps = capitalizeFirstLetter(query); // Capitalize first letter
  const variants = [caps, query.toLowerCase()]; // Create two search variants
  const lists = variants.map(v => filterArray(v, pool)); // Filter tasks by text
  const results = [...new Set(lists.flat())]; // Remove duplicate matches
  if (results.length === 0) { renderFoundTasks({}); return; } // No matches → show message
  getIdsOfTasks(results); // Extract IDs and fetch details
}

// Extracts task IDs from found string entries
function getIdsOfTasks(foundTasksArray) {
  const idArray = [];
  for (let i = 0; i < foundTasksArray.length; i++) {
    idArray.push(getLastElement(foundTasksArray, i)); // Get ID from end of string
  }
  getSingleTask(idArray); // Fetch full task details
}

// Fetches each task by its ID
async function getSingleTask(idArray) {
  const taskArray = [];
  for (let i = 0; i < idArray.length; i++) {
    const id = idArray[i];
    const single = await fetchSingleTask(id); // API call per ID
    taskArray[id] = single;
  }
  renderFoundTasks(taskArray); // Render fetched tasks
}

// Renders found tasks or shows “no results” message
async function renderFoundTasks(taskArray) {
  clearColumns(); // Reset the board
  const has = taskArray && Object.keys(taskArray).length > 0;
  if (!has) {
    showNoResults("No results found."); // Show info message
    updateAllEmptyStates(); // Update empty board columns
    return;
  }
  Object.entries(taskArray).forEach(([id, t]) => addTaskCard(id, t)); // Add task cards
  hideNoResults();
  updateAllEmptyStates();
}

// Filters an array for items containing the search value
function filterArray(value, arrayForFiltering) {
  return arrayForFiltering.filter((txt) => txt.includes(value));
}

// Capitalizes the first letter of a string
function capitalizeFirstLetter(val) {
  const s = String(val);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Returns the last element of a comma-separated string
function getLastElement(arr, index) {
  return arr[index].split(",").pop();
}

// Adds a delay to prevent too many search calls
function debounce(func, timeout = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

// Runs findTask() with a typing delay
let processChanges = debounce(() => findTask());

// Converts the tasks object into a searchable string array
function changeObjectToArray(tasksResponse) {
  const entries = Object.entries(tasksResponse);
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const [id, t] = entries[i];
    out.push(`${t.title}, ${t.description}, ${t.assignedContacts},${id}`);
  }
  return out;
}

// Displays a message if no tasks were found
function showNoResults(msg) {
  const box = document.getElementById("search-empty-state");
  if (!box) return;
  box.textContent = msg || "No entries found";
  box.classList.remove("d_none");
}

// Hides the “no results” message
function hideNoResults() {
  const box = document.getElementById("search-empty-state");
  if (!box) return;
  box.classList.add("d_none");
}


// const defaultSrc = "../assets/svg/search_default.svg";
// const hoverSrc = "../assets/svg/search_hover.svg";
// const clickedSrc = "../assets/svg/search_clicked.svg";

// // ---- Part 1: setup and initialization ----
// function setupSearchIcons() {
//   document.querySelectorAll(".search-icon").forEach((icon) => {
//     const input = icon.nextElementSibling;
//     let clickTimeout;

//     addHoverHandlers(icon);
//     addClickHandler(icon, input, () => (clickTimeout = handleClick(icon, clickTimeout)));
//     addResetHandlers(icon, input, () => clearTimeout(clickTimeout));
//   });
// }

// // ---- Part 2: hover behavior ----
// function addHoverHandlers(icon) {
//   icon.addEventListener("mouseenter", () => {
//     if (!icon.classList.contains("active")) icon.src = hoverSrc;
//   });

//   icon.addEventListener("mouseleave", () => {
//     if (!icon.classList.contains("active")) icon.src = defaultSrc;
//   });
// }

// // ---- Part 3: click behavior (500 ms effect) ----
// function handleClick(icon, clickTimeout) {
//   icon.src = clickedSrc;
//   icon.classList.add("active");
//   const input = icon.nextElementSibling;
//   input.focus();

//   clearTimeout(clickTimeout);
//   return setTimeout(() => {
//     icon.classList.remove("active");
//     icon.src = defaultSrc;
//   }, 100);
// }

// function addClickHandler(icon, input, handler) {
//   icon.addEventListener("click", handler);
// }

// // ---- Part 4: reset on typing or blur ----
// function addResetHandlers(icon, input, clearTimer) {
//   input.addEventListener("input", () => resetIcon(icon, clearTimer));
//   input.addEventListener("blur", () => resetIcon(icon, clearTimer));
// }

// function resetIcon(icon, clearTimer) {
//   clearTimer();
//   icon.classList.remove("active");
//   icon.src = defaultSrc;
// }

// // ---- Initialize everything ----
// setupSearchIcons();
