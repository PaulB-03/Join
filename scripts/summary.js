/**
 * Initializes summary page: greeting overlay, header, box listeners, and data loading.
 * @returns {void}
 */
function initForSummary() {
  greetingOverlayMobile();
  sidebarHeaderInit();
  boxListener();
  dataForSummary();
}

/**
 * Loads tasks from Firebase, retrieves current time, and displays summary greeting.
 * @returns {void}
 */
function dataForSummary() {
  getDataForTasks();
  getCurrentTime();
  showSummaryGreeting();
}

/**
 * Reads the current time and updates the greeting text accordingly.
 * @returns {void}
 */
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  changeInnerHtmlOfSummaryGreeting(hours + "." + minutes);
}

/**
 * Sets the greeting message based on the hour of the day.
 * @param {number|string} hours - Current hour (0-23)
 * @returns {void}
 */
function changeInnerHtmlOfSummaryGreeting(hours) {
  let sumGreeting = document.getElementById("sumGreeting");
  sumGreeting.innerHTML = "";
  if (hours <= 12) sumGreeting.innerHTML = "Good morning";
  else if (hours >= 12 && hours < 18) sumGreeting.innerHTML = "Good afternoon";
  else sumGreeting.innerHTML = "Good evening";
}

/**
 * Fetches tasks from Firebase Realtime Database and triggers summary counting.
 * @returns {Promise<void>}
 */
async function getDataForTasks() {
  const BASE_URL = DB_ROOT;
  let response = await fetch(BASE_URL + ".json");
  responseToJson = "";
  responseToJson = await response.json();
  countForSummary(responseToJson);
}

/**
 * Processes the task data to count states, filter upcoming deadlines, and update priority counts.
 * @param {Object} responseToJson - Parsed JSON response from Firebase
 * @returns {void}
 */
function countForSummary(responseToJson) {
  let countStatesObj = createCountObject();
  let datesObject = createDatesObject();
  let arr = Object.entries(responseToJson.tasks);
  for (let i = 0; i < arr.length; i++) {
    const taskState = arr[i][1].state;
    checkState(datesObject, taskState, i, arr);
    incrementStateCount(countStatesObj, taskState);
  }
  filterNextUpcomingDeadline(datesObject, responseToJson);
  changeInnerHtmlOfSummary(countStatesObj);
  updateUrgentCountGlobal(responseToJson); // optional
}

/**
 * Increments the count for a specific task state.
 * @param {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} obj - Counters object
 * @param {string} state - Task state ("in progress", "toDo", "done", "await feedback")
 * @returns {void}
 */
function incrementStateCount(obj, state) {
  switch (state) {
    case "in progress":
      obj.progressCount++;
      break;
    case "toDo":
      obj.toDoCount++;
      break;
    case "done":
      obj.doneCount++;
      break;
    case "await feedback":
      obj.awaitFeedbackCount++;
      break;
  }
}

/**
 * Creates an object to aggregate task dates and priorities for summary processing.
 * @returns {{dates:string[], prioritys:string[]}} - Aggregation object
 */
function createDatesObject() {
  return { dates: [], prioritys: [] };
}

/**
 * Creates an object to store counters for different task states.
 * @returns {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} - Counters object
 */
function createCountObject() {
  return { progressCount: 0, toDoCount: 0, doneCount: 0, awaitFeedbackCount: 0 };
}

/**
 * Checks a task's state and priority, and adds urgent tasks to the aggregation object.
 * @param {{dates:string[],prioritys:string[]}} datesObject - Object to store dates and priorities
 * @param {string} taskState - State of the task
 * @param {number} index - Index of the task in objectToArray
 * @param {Array} objectToArray - Array of task entries [key, value]
 * @returns {{dates:string[],prioritys:string[]}} - Updated aggregation object
 */
function checkState(datesObject, taskState, index, objectToArray) {
  if (taskState === "done") return;

  const task = objectToArray[index][1];

  // Only push if priority is "urgent"
  if (task.priority === "urgent") {
    datesObject.dates.push(task.date);
    datesObject.prioritys.push(task.priority);
  }

  return datesObject;
}

/**
 * Updates the HTML of summary boxes to reflect current task counts.
 * @param {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} countStatesObj - Counters object
 * @returns {void}
 */
function changeInnerHtmlOfSummary(countStatesObj) {
  let idArray = ["progressCountBox", "toDoNumberBox", "doneNumberBox", "awaitFreedbackCountBox"];
  let objectToArray = Object.entries(countStatesObj);
  for (let i = 0; i < idArray.length; i++) {
    let el = document.getElementById(`${idArray[i]}`);
    el.innerHTML = "";
    el.innerHTML = objectToArray[i][1];
  }
  let all = document.getElementById("allTaskCountBox");
  all.innerHTML = "";
  all.innerHTML = calcAllTasksInBoard(countStatesObj);
}

/**
 * Sums all task state counters to get total tasks.
 * @param {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} countStatesObj - Counters object
 * @returns {number} Total task count
 */
function calcAllTasksInBoard(countStatesObj) {
  return countStatesObj.progressCount + countStatesObj.toDoCount + countStatesObj.doneCount + countStatesObj.awaitFeedbackCount;
}

/**
 * Adds click event listeners to summary boxes that redirect to the board page.
 * @returns {void}
 */
function boxListener() {
  const boxes = document.getElementsByClassName("summaryBox");
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].addEventListener("click", () => {
      window.location.href = "../html/board.html";
    });
  }
}

/**
 * Displays or resets the mobile greeting overlay based on viewport width and localStorage flag.
 * @returns {void}
 */
function greetingOverlayMobile() {
  let c = document.getElementById("sumGreetingContainer");
  let showedOnce = getLocalLocalStorageItem("showedOnce", "true");
  if (window.innerWidth <= 1280 && !showedOnce) {
    changeHTMLOfGreetingContainer(c);
    fadeOutGreetingOverlay(c);
  } else resetHTMLOfGreetingContainer(c);
}

/**
 * Fades out the greeting overlay with a 1.5s delay.
 * @param {HTMLElement} sumGreetingContainer - Container element to fade
 * @returns {void}
 */
function fadeOutGreetingOverlay(sumGreetingContainer) {
  setTimeout(() => {
    sumGreetingContainer.style.opacity = "0";
  }, 1500);
}

/**
 * Resets all inline styles of the greeting container.
 * @param {HTMLElement} sumGreetingContainer - Container element to reset
 * @returns {void}
 */
function resetHTMLOfGreetingContainer(sumGreetingContainer) {
  sumGreetingContainer.style.cssText = "";
}

/**
 * Sets inline styles to display the mobile greeting overlay and updates localStorage.
 * @param {HTMLElement} sumGreetingContainer - Container element to style
 * @returns {void}
 */
function changeHTMLOfGreetingContainer(sumGreetingContainer) {
  sumGreetingContainer.style.cssText =
    "transition: opacity 0.7s cubic-bezier(0.55, 0.085, 0.68, 0.53); opacity: 1;display: flex; justify-content: center; align-items: center; position: absolute;top: 0; left: 0; background-color: var(--main-bg-color); width: 100%;  height: 100%;";
  setLocalStorageItem("showedOnce", "true");
}

/**
 * Saves a key-value pair to localStorage.
 * @param {string} key - Storage key
 * @param {string} value - Storage value
 * @returns {void}
 */
function setLocalStorageItem(key, value) {
  localStorage.setItem(`${key}`, `${value}`);
}

/**
 * Retrieves a value from localStorage by key.
 * @param {string} key - Storage key
 * @param {string} [value] - Optional; not used (kept for compatibility)
 * @returns {string|null} Stored value or null if not found
 */
function getLocalLocalStorageItem(key, value) {
  return localStorage.getItem(`${key}`, `${value}`);
}
