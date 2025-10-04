// Initializes the summary page (sidebar, box listeners, load data)
function initForSummary() {
  greetingOverlayMobile();
  sidebarHeaderInit();
  boxListener();
  dataForSummary();
}

// Loads task data, gets current time, and shows greeting
function dataForSummary() {
  getDataForTasks();
  getCurrentTime();
  showSummaryGreeting(); // comes from logIn_Malte.js and logIn.js
}

// Gets current time and updates greeting
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  changeInnerHtmlOfSummaryGreeting(hours + "." + minutes);
}

// Displays greeting depending on the current hour
function changeInnerHtmlOfSummaryGreeting(hours) {
  let sumGreeting = document.getElementById("sumGreeting");
  sumGreeting.innerHTML = "";

  if (hours <= 12) {
    sumGreeting.innerHTML = "Good morning";
  } else if (hours >= 12 && hours < 18) {
    sumGreeting.innerHTML = "Good afternoon";
  } else {
    sumGreeting.innerHTML = "Good evening";
  }
}

// Fetches Data from Firebase
async function getDataForTasks() {
  const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

  let response = await fetch(BASE_URL + ".json");
  responseToJson = "";
  responseToJson = await response.json();
  countForSummary(responseToJson);
}

// Counts how many tasks are in each state + handles deadlines
function countForSummary(responseToJson) {
  let countStatesObj = createCountObject();
  let datesObject = createDatesObject();
  let objectToArray = Object.entries(responseToJson.tasks);
  for (let index = 0; index < objectToArray.length; index++) {
    let taskState = objectToArray[index][1].state;
    checkState(datesObject, taskState, index, objectToArray);
    switch (taskState) {
      case "in progress":
        countStatesObj.progressCount++;
        break;
      case "toDo":
        countStatesObj.toDoCount++;
        break;
      case "done":
        countStatesObj.doneCount++;
        break;
      case "await feedback":
        countStatesObj.awaitFeedbackCount++;
        break;
    }
  }
  filterNextUpcomingDeadline(datesObject, responseToJson);
  changeInnerHtmlOfSummary(countStatesObj);
}

// creates obj for countForSummary
function createDatesObject() {
  let datesObject = {
    "dates": [],
    "prioritys": [],
  };
  return datesObject;
}
// creates obj for countForSummary
function createCountObject() {
  let countStatesObj = {
    "progressCount": 0,
    "toDoCount": 0,
    "doneCount": 0,
    "awaitFeedbackCount": 0,
  };
  return countStatesObj;
}

// Push task’s date and priority if it's not "done"
function checkState(datesObject, taskState, index, objectToArray) {
  if ("done" == taskState) {
    return;
  } else {
    let dateToPush = objectToArray[index][1].date;
    datesObject.dates.push(dateToPush);
    datesObject.prioritys.push(objectToArray[index][1].priority);
    return datesObject;
  }
}

// If no deadline found, push "Nothing to worry"
function stringIfNoDateFound(nextUpcomingDeadlineArray) {
  urgencyImgContainer.style = "background-color:  var(--button-low)";
  urgencyImg.src = "../assets/svg/check_2.svg";
  return nextUpcomingDeadlineArray.push("Nothing to worry");
}

// Converts priority strings to numbers and sorts them
function getHighestPriority(datesObject, nextUpcomingDeadline) {
  filterIrrelevantPrioritys(datesObject, nextUpcomingDeadline);
  let priorityArray = datesObject.prioritys;
  let numberArray = [];
  for (let index = 0; index < priorityArray.length; index++) {
    let priority = priorityArray[index];
    switch (priority) {
      case "urgent":
        numberArray.push(1);
        break;
      case "medium":
        numberArray.push(2);
        break;
      case "low":
        numberArray.push(3);
        break;
    }
  }
  sortNumberArray(numberArray);
}

// filters and cuts out the unnecessary prioritys
function filterIrrelevantPrioritys(datesObject, nextUpcomingDeadline) {
  for (let index = 0; index < datesObject.dates.length; index++) {
    let dateToFilter = new Date(datesObject.dates[index]);
    let nextDeadline = new Date(nextUpcomingDeadline);

    if (dateToFilter < nextDeadline || dateToFilter > nextDeadline) {
      datesObject.dates.splice(index, 1);
      datesObject.prioritys.splice(index, 1);
      index = -1;
    }
  }
  return datesObject;
}

// Sorts numbers and gets the highest priority
function sortNumberArray(numberArray) {
  let sortedArray = numberArray.sort();
  let highesValue = sortedArray[0];
  changeBackgroundColorOfUrgencyImg(sortedArray[0]);
  changeUrgencyImg(highesValue);
}

// Changes background color of urgency image based on priority value
function changeBackgroundColorOfUrgencyImg(highesValue) {
  let urgencyImgContainer = document.getElementById("urgencyImgContainer");

  switch (highesValue) {
    case 1:
      urgencyImgContainer.style = "background-color:  var(--button-urgent)";
      break;
    case 2:
      urgencyImgContainer.style = "background-color:  var(--button-medium)";
      break;
    case 3:
      urgencyImgContainer.style = "background-color:  var(--button-low)";
      break;
  }
}

// Updates the urgency image depending on the numeric priority
function changeUrgencyImg(highesValue) {
  let urgencyImg = document.getElementById("urgencyImg");
  switch (highesValue) {
    case 1:
      urgencyImg.src = "../assets/svg/double_arrow_up.svg";
      break;
    case 2:
      urgencyImg.src = "../assets/svg/double_lines_white.svg";
      break;
    case 3:
      urgencyImg.src = "../assets/svg/double_arrow_down_white.svg";
      break;
  }
}

// Filters for next upcoming deadline and for missed deadLines
function filterNextUpcomingDeadline(datesObject, responseToJson) {
  let nextUpcomingDeadlineArray = datesObject.dates.filter(verifyTheRightDate);
  if (nextUpcomingDeadlineArray.length == 0 && datesObject.dates.length == 0) {
    stringIfNoDateFound(nextUpcomingDeadlineArray);
  } else if (nextUpcomingDeadlineArray.length == 0 && datesObject.dates.length > 0) {
    nextUpcomingDeadlineArray = missedDeadlineCall(nextUpcomingDeadlineArray, datesObject);
  }
  let sortedArray = nextUpcomingDeadlineArray.sort();
  let nextUpcomingDeadline = sortedArray[0];
  countNextDeadlineDate(sortedArray, datesObject);
  getHighestPriority(datesObject, nextUpcomingDeadline);
  getDateFromDataBankAndChangeFormat(nextUpcomingDeadline, responseToJson);
}

// changes Html Text in DeadlineBox p element
function changeHtmlForMissedDeadlines() {
  let deadLineText = document.getElementById("deadLineText");
  deadLineText.innerHTML = "";
  deadLineText.innerHTML = "Missed Deadline";
}

// handles missed deadlines by setting HTML
function missedDeadlineCall(nextUpcomingDeadlineArray, datesObject) {
  changeHtmlForMissedDeadlines();
  return (nextUpcomingDeadlineArray = datesObject.dates);
}

// Counts how many tasks share the same nearest deadline
function countNextDeadlineDate(sortedArray) {
  let deadLineCount = 0;
  for (let index = 0; index < sortedArray.length; index++) {
    if (sortedArray[0] == sortedArray[index] && sortedArray[0] !== "Nothing to worry") {
      deadLineCount++;
    }
  }
  changeInnerHTMlOfUrgencyBox(deadLineCount);
}

// Updates the deadline count in the urgency box
function changeInnerHTMlOfUrgencyBox(deadLineCount) {
  let urgencyCountHTml = document.getElementById("urgencyCountBox");
  urgencyCountHTml.innerHTML = "";
  urgencyCountHTml.innerHTML = deadLineCount;
}

// Checks if a date is today or in the future
function verifyTheRightDate(date) {
  const now = new Date();
  const nowDay = now.getDate();
  const nowYear = now.getFullYear();
  let nowMonth = now.getMonth() + 1;
  let formatedDate = returnTheRightDateFormat(nowDay, nowMonth, nowYear);
  return date >= formatedDate;
}

// date: month and day has to be at least two digit -> adds 0 to date day/month if smaller then 10
function returnTheRightDateFormat(nowDay, nowMonth, nowYear) {
  let nowDayNew;
  let nowMonthNew;
  if (nowMonth < 10 || nowDay < 10) {
    if (nowMonth < 10) {
      nowMonthNew = "0" + nowMonth;
    } else {
      nowMonthNew = nowMonth;
    }
    if (nowDay < 10) {
      nowDayNew = "0" + nowDay;
    } else {
      nowDayNew = nowDay;
    }
    return (formatedDate = nowYear + "-" + nowMonthNew + "-" + nowDayNew);
  } else {
    return (formatedDate = nowYear + "-" + nowMonth + "-" + nowDay);
  }
}

// Converts deadline into "Month Day, Year" format
function getDateFromDataBankAndChangeFormat(deadLineDate) {
  let newFormat;
  if (deadLineDate !== "Nothing to worry") {
    let date = new Date(deadLineDate);
    let calculatedMonth = date.getMonth();
    let year = date.getFullYear();
    let day = date.getDate();
    newFormat = responseToJson.months[calculatedMonth] + " " + day + ", " + year;
  } else {
    newFormat = deadLineDate;
  }
  changeInnerHtmlForDeadline(newFormat);
}

// Updates deadline text in the urgency box
function changeInnerHtmlForDeadline(nextUpcomingDeadline) {
  let urgencyDeadlineDate = document.getElementById("urgencyDeadline");
  urgencyDeadlineDate.innerHTML = "";
  urgencyDeadlineDate.innerHTML = nextUpcomingDeadline;
}

// Updates task counts in summary boxes
function changeInnerHtmlOfSummary(countStatesObj) {
  let idArray = ["progressCountBox", "toDoNumberBox", "doneNumberBox", "awaitFreedbackCountBox"];
  let objectToArray = Object.entries(countStatesObj);

  for (let index = 0; index < idArray.length; index++) {
    let hTmlId = document.getElementById(`${idArray[index]}`);
    hTmlId.innerHTML = "";
    hTmlId.innerHTML = objectToArray[index][1];
  }

  let allTaskCount = document.getElementById("allTaskCountBox");
  allTaskCount.innerHTML = "";
  allTaskCount.innerHTML = calcAllTasksInBoard(countStatesObj);
}

// Returns total number of tasks
function calcAllTasksInBoard(countStatesObj) {
  let allTaskCount = countStatesObj.progressCount + countStatesObj.toDoCount + countStatesObj.doneCount + countStatesObj.awaitFeedbackCount;
  return allTaskCount;
}

// Adds click event to summary boxes -> redirects to board.html
function boxListener() {
  const summaryBoxes = document.getElementsByClassName("summaryBox");
  for (let index = 0; index < summaryBoxes.length; index++) {
    summaryBoxes[index].addEventListener("click", () => {
      window.location.href = "../html/board.html";
    });
  }
}

// Shows or resets greeting overlay on mobile
function greetingOverlayMobile() {
  let sumGreetingContainer = document.getElementById("sumGreetingContainer");
  let showedOnce = getLocalLocalStorageItem("showedOnce", "true");
  if (window.innerWidth <= 1280 && !showedOnce) {
    changeHTMLOfGreetingContainer(sumGreetingContainer);
    fadeOutGreetingOverlay(sumGreetingContainer);
  } else {
    resetHTMLOfGreetingContainer(sumGreetingContainer);
  }
}

// Fades out greeting overlay after delay
function fadeOutGreetingOverlay(sumGreetingContainer) {
  setTimeout(() => {
    sumGreetingContainer.style.opacity = "0";
  }, 1500);
}

// Resets inline styles of greeting overlay and summary section
function resetHTMLOfGreetingContainer() {
  let summarySection = document.getElementById("summarySection");

  sumGreetingContainer.style.cssText = "";

  summarySection.style.cssText = "";
}

// Applies mobile greeting overlay styles and sets localStorage flag
function changeHTMLOfGreetingContainer(sumGreetingContainer) {
  let summarySection = document.getElementById("summarySection");

  sumGreetingContainer.style.cssText =
    "transition: opacity 2s ease; opacity: 1;display: flex; justify-content: center; align-items: center; position: absolute;top: 0; left: 0; background-color: var(--main-bg-color); width: 100%;  height: 100%;";
  summarySection.style.cssText = "padding-left: 0";

  setLocalStorageItem("showedOnce", "true");
}

// Saves a key/value pair to localStorage
function setLocalStorageItem(key, value) {
  localStorage.setItem(`${key}`, `${value}`);
}

// Gets a value from localStorage by key
function getLocalLocalStorageItem(key, value) {
  return localStorage.getItem(`${key}`, `${value}`);
}
