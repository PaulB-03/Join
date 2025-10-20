// Initializes the summary page (sidebar, box listeners, load data)
/**
 * Initializes summary page: greeting overlay, header, box listeners, data.
 * @returns {void}
 */
function initForSummary() {
  greetingOverlayMobile();
  sidebarHeaderInit();
  boxListener();
  dataForSummary();
}

// Loads task data, gets current time, and shows greeting
/**
 * Loads tasks, gets time, and shows greeting.
 * @returns {void}
 */
function dataForSummary() {
  getDataForTasks();
  getCurrentTime();
  showSummaryGreeting(); // comes from logIn_Malte.js and logIn.js
}

// Gets current time and updates greeting
/**
 * Reads current time and updates greeting text.
 * @returns {void}
 */
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  changeInnerHtmlOfSummaryGreeting(hours + "." + minutes);
}

// Displays greeting depending on the current hour
/**
 * Sets greeting based on hour of day.
 * @param {number|string} hours
 * @returns {void}
 */
function changeInnerHtmlOfSummaryGreeting(hours) {
  let sumGreeting = document.getElementById("sumGreeting");
  sumGreeting.innerHTML = "";
  if (hours <= 12) sumGreeting.innerHTML = "Good morning";
  else if (hours >= 12 && hours < 18) sumGreeting.innerHTML = "Good afternoon";
  else sumGreeting.innerHTML = "Good evening";
}

// Fetches Data from Firebase
/**
 * Fetches data from Firebase and triggers counting.
 * @returns {Promise<void>}
 */
async function getDataForTasks() {
  const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";
  let response = await fetch(BASE_URL + ".json");
  responseToJson = "";
  responseToJson = await response.json();
  countForSummary(responseToJson);
}

// Counts how many tasks are in each state + handles deadlines
/**
 * Counts task states and resolves next deadline/priority.
 * @param {Object} responseToJson
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
}

/**
 * Increments counters by state.
 * @param {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} obj
 * @param {string} state
 * @returns {void}
 */
function incrementStateCount(obj, state) {
  switch (state) {
    case "in progress": obj.progressCount++; break;
    case "toDo": obj.toDoCount++; break;
    case "done": obj.doneCount++; break;
    case "await feedback": obj.awaitFeedbackCount++; break;
  }
}

// creates obj for countForSummary
/**
 * Creates dates/priority aggregation object.
 * @returns {{dates:string[], prioritys:string[]}}
 */
function createDatesObject() {
  return { dates: [], prioritys: [] };
}

// creates obj for countForSummary
/**
 * Creates counters object for task states.
 * @returns {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}}
 */
function createCountObject() {
  return { progressCount: 0, toDoCount: 0, doneCount: 0, awaitFeedbackCount: 0 };
}

// Push task’s date and priority if it's not "done"
/**
 * Collects date/priority for non-done tasks.
 * @param {{dates:string[],prioritys:string[]}} datesObject
 * @param {string} taskState
 * @param {number} index
 * @param {Array} objectToArray
 * @returns {{dates:string[],prioritys:string[]}|void}
 */
function checkState(datesObject, taskState, index, objectToArray) {
  if (taskState === "done") return;
  let dateToPush = objectToArray[index][1].date;
  datesObject.dates.push(dateToPush);
  datesObject.prioritys.push(objectToArray[index][1].priority);
  return datesObject;
}

// Updates task counts in summary boxes
/**
 * Updates summary counters and total task count.
 * @param {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} countStatesObj
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

// Returns total number of tasks
/**
 * Sums all task state counters.
 * @param {{progressCount:number,toDoCount:number,doneCount:number,awaitFeedbackCount:number}} countStatesObj
 * @returns {number}
 */
function calcAllTasksInBoard(countStatesObj) {
  return countStatesObj.progressCount + countStatesObj.toDoCount + countStatesObj.doneCount + countStatesObj.awaitFeedbackCount;
}

// Adds click event to summary boxes -> redirects to board.html
/**
 * Adds click redirect to each summary box.
 * @returns {void}
 */
function boxListener() {
  const boxes = document.getElementsByClassName("summaryBox");
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].addEventListener("click", () => { window.location.href = "../html/board.html"; });
  }
}

// Shows or resets greeting overlay on mobile
/**
 * Displays or resets mobile greeting overlay.
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

// Fades out greeting overlay after delay
/**
 * Fades out greeting overlay with delay.
 * @param {HTMLElement} sumGreetingContainer
 * @returns {void}
 */
function fadeOutGreetingOverlay(sumGreetingContainer) {
  setTimeout(() => { sumGreetingContainer.style.opacity = "0"; }, 1500);
}

// Resets inline styles of greeting overlay and summary section
/**
 * Resets inline styles for greeting container.
 * @param {HTMLElement} sumGreetingContainer
 * @returns {void}
 */
function resetHTMLOfGreetingContainer(sumGreetingContainer) {
  sumGreetingContainer.style.cssText = "";
}

// Applies mobile greeting overlay styles and sets localStorage flag
/**
 * Applies overlay styles and sets localStorage flag.
 * @param {HTMLElement} sumGreetingContainer
 * @returns {void}
 */
function changeHTMLOfGreetingContainer(sumGreetingContainer) {
  sumGreetingContainer.style.cssText =
    "transition: opacity 0.7s cubic-bezier(0.55, 0.085, 0.68, 0.53); opacity: 1;display: flex; justify-content: center; align-items: center; position: absolute;top: 0; left: 0; background-color: var(--main-bg-color); width: 100%;  height: 100%;";
  setLocalStorageItem("showedOnce", "true");
}

// Saves a key/value pair to localStorage
/**
 * Saves a key/value pair to localStorage.
 * @param {string} key
 * @param {string} value
 * @returns {void}
 */
function setLocalStorageItem(key, value) {
  localStorage.setItem(`${key}`, `${value}`);
}

// Gets a value from localStorage by key
/**
 * Reads a value from localStorage by key.
 * @param {string} key
 * @param {string} [value] - Unused; kept for compatibility.
 * @returns {string|null}
 */
function getLocalLocalStorageItem(key, value) {
  return localStorage.getItem(`${key}`, `${value}`);
}
