async function findTask() {
  const q = document.getElementById('taskSearchInput').value.trim();
  if (q.length <= 1 || !isNaN(q)) { hideNoResults(); init(); return; }
  const tasks = await getTasks();
  const pool = changeObjectToArray(tasks);
  const keys = [capitalizeFirstLetter(q), q.toLowerCase()];
  const found = keys.flatMap(k => filterArray(k, pool));
  const unique = [...new Set(found)];
  if (unique.length === 0) { renderFoundTasks({}); return; }
  getIdsOfTasks(unique);
}

function getIdsOfTasks(foundTasksArray) {
  const idArray = [];
  for (let i = 0; i < foundTasksArray.length; i++) {
    idArray.push(getLastElement(foundTasksArray, i));
  }
  getSingleTask(idArray);
}

async function getSingleTask(idArray) {
  const taskArray = [];
  for (let i = 0; i < idArray.length; i++) {
    const id = idArray[i];
    const single = await fetchSingleTask(id);
    taskArray[id] = single;
  }
  renderFoundTasks(taskArray);
}

async function renderFoundTasks(taskArray) {
  clearColumns();
  const has = taskArray && Object.keys(taskArray).length > 0;
  if (!has) { showNoResults('Keine Ergebnisse gefunden.'); updateAllEmptyStates(); return; }
  Object.entries(taskArray).forEach(([id, t]) => addTaskCard(id, t));
  hideNoResults();
  updateAllEmptyStates();
}

function filterArray(value, arrayForFiltering) {
  return arrayForFiltering.filter(txt => txt.includes(value));
}

function capitalizeFirstLetter(val) {
  const s = String(val);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getLastElement(arr, index) {
  return arr[index].split(",").pop();
}

function debounce(func, timeout = 1000) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

let processChanges = debounce(() => findTask());

function changeObjectToArray(tasksResponse) {
  const entries = Object.entries(tasksResponse);
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const [id, t] = entries[i];
    out.push(`${t.title}, ${t.description}, ${t.assignedContacts},${id}`);
  }
  return out;
}

function showNoResults(msg) {
  const box = document.getElementById('search-empty-state');
  if (!box) return;
  box.textContent = msg || 'Keine Ergebnisse gefunden.';
  box.classList.remove('d_none');
}

function hideNoResults() {
  const box = document.getElementById('search-empty-state');
  if (!box) return;
  box.classList.add('d_none');
}
