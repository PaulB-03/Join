// filters tasks based on user input
/**
 * Filters tasks by the search input and renders matches.
 * Falls Query zu kurz/numerisch ist: Board zurücksetzen.
 * @returns {Promise<void>}
 */
async function findTask() {
  const input = document.getElementById("taskSearchInput");
  const query = input.value.trim();
  const tooShort = query.length <= 1 || !isNaN(query);
  if (tooShort) { hideNoResults(); init(); return; }
  const tasks = await getTasks();
  const pool = changeObjectToArray(tasks);
  const caps = capitalizeFirstLetter(query);
  const variants = [caps, query.toLowerCase()];
  const lists = variants.map(v => filterArray(v, pool));
  const results = [...new Set(lists.flat())];
  if (results.length === 0) { renderFoundTasks({}); return; }
  getIdsOfTasks(results);
}

/**
 * Extracts task IDs from matched strings and triggers fetch.
 * @param {string[]} foundTasksArray
 * @returns {void}
 */
function getIdsOfTasks(foundTasksArray) {
  const idArray = [];
  for (let i = 0; i < foundTasksArray.length; i++) {
    idArray.push(getLastElement(foundTasksArray, i));
  }
  getSingleTask(idArray);
}

/**
 * Fetches tasks by an array of IDs and renders them.
 * @param {string[]} idArray
 * @returns {Promise<void>}
 */
async function getSingleTask(idArray) {
  const taskArray = [];
  for (let i = 0; i < idArray.length; i++) {
    const id = idArray[i];
    const single = await fetchSingleTask(id);
    taskArray[id] = single;
  }
  renderFoundTasks(taskArray);
}

/**
 * Renders found tasks or shows "no results".
 * @param {Record<string, any>} taskArray
 * @returns {Promise<void>}
 */
async function renderFoundTasks(taskArray) {
  clearColumns();
  const has = taskArray && Object.keys(taskArray).length > 0;
  if (!has) {
    showNoResults("No results found.");
    updateAllEmptyStates();
    return;
  }
  Object.entries(taskArray).forEach(([id, t]) => addTaskCard(id, t));
  hideNoResults();
  updateAllEmptyStates();
}

/**
 * Returns items that contain the given value (case-sensitive).
 * @param {string} value
 * @param {string[]} arrayForFiltering
 * @returns {string[]}
 */
function filterArray(value, arrayForFiltering) {
  return arrayForFiltering.filter((txt) => txt.includes(value));
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} val
 * @returns {string}
 */
function capitalizeFirstLetter(val) {
  const s = String(val);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Returns the last comma-separated part of an array item.
 * @param {string[]} arr
 * @param {number} index
 * @returns {string}
 */
function getLastElement(arr, index) {
  return arr[index].split(",").pop();
}

/**
 * Debounces a function call to reduce rapid invocations.
 * @template T
 * @param {(this: any, ...args: T[]) => void} func
 * @param {number} [timeout=1000]
 * @returns {(...args: T[]) => void}
 */
function debounce(func, timeout = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

/** Runs findTask() with a typing delay. */
let processChanges = debounce(() => findTask());

/**
 * Flattens task objects into searchable strings.
 * Format: "title, description, assignedContacts,ID"
 * @param {Record<string, any>} tasksResponse
 * @returns {string[]}
 */
function changeObjectToArray(tasksResponse) {
  const entries = Object.entries(tasksResponse);
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const [id, t] = entries[i];
    out.push(`${t.title}, ${t.description}, ${t.assignedContacts},${id}`);
  }
  return out;
}

/**
 * Shows a "no results" message box.
 * @param {string} msg
 * @returns {void}
 */
function showNoResults(msg) {
  const box = document.getElementById("search-empty-state");
  if (!box) return;
  box.textContent = msg || "No entries found";
  box.classList.remove("d_none");
}

/**
 * Hides the "no results" message box.
 * @returns {void}
 */
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
