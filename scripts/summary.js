
function initForSummary() {
  // Initializes the summary page (sidebar, box listeners, load data)
  sidebarHeaderInit();
  boxListener()
  dataForSummary();
}

function dataForSummary() {
  // Loads task data, gets current time, and shows greeting
  getDataForTasks();
  getCurrentTime();
  showSummaryGreeting(); // comes from logIn_Malte.js and logIn.js
}

function getCurrentTime() {
  // Gets current time and updates greeting
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  changeInnerHtmlOfSummaryGreeting(hours + "." + minutes);
}

function changeInnerHtmlOfSummaryGreeting(hours) {
  // Displays greeting depending on the current hour
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

async function getDataForTasks() {
  // Fetches Data from Firebase
  const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

  let response = await fetch(BASE_URL + ".json");
  responseToJson = "";
  responseToJson = await response.json();
  countForSummary(responseToJson);
}

function countForSummary(responseToJson) {
  // Counts how many tasks are in each state + handles deadlines
  let countStatesObj = {
    "progressCount": 0,
    "toDoCount": 0,
    "doneCount": 0,
    "awaitFeedbackCount": 0,
  }
  let datesObject = {
    "dates": [],
    "prioritys": [],
  };
  let objectToArray = Object.entries(responseToJson.tasks);

  for (let index = 0; index < objectToArray.length; index++) {
    let taskState = objectToArray[index][1].state;
    checkState(datesObject, taskState, index, objectToArray)
    switch (taskState) {
      case "in progress": countStatesObj.progressCount++; break;
      case "toDo": countStatesObj.toDoCount++; break;
      case "done": countStatesObj.doneCount++; break;
      case "await feedback": countStatesObj.awaitFeedbackCount++; break;
    }
  }

  filterNextUpcomingDeadline(datesObject, responseToJson);
  changeInnerHtmlOfSummary(countStatesObj);
}

function stringIfNoDateFound(nextUpcomingDeadlineArray) {
  // If no deadline found, push "Nothing to worry"
  return nextUpcomingDeadlineArray.push("Nothing to worry")
}

function getHighestPriority(datesObject, nextUpcomingDeadline) {
  // Converts priority strings to numbers and sorts them
  filterIrrelevantPrioritys(datesObject, nextUpcomingDeadline)
  let priorityArray = datesObject.prioritys
  let numberArray = []
  for (let index = 0; index < priorityArray.length; index++) {
    let priority = priorityArray[index]
    switch (priority) {
      case "urgent": numberArray.push(1); break;
      case "medium": numberArray.push(2); break;
      case "low": numberArray.push(3); break;
    }
  }
  sortNumberArray(numberArray)
}

function filterIrrelevantPrioritys(datesObject, nextUpcomingDeadline) {
  // filters and cuts out the unnecessary prioritys
  for (let index = 0; index < datesObject.dates.length; index++) {
    let dateToFilter = new Date(datesObject.dates[index])
    let nextDeadline = new Date(nextUpcomingDeadline)

    if (dateToFilter < nextDeadline || dateToFilter > nextDeadline) {
      datesObject.dates.splice(index, 1)
      datesObject.prioritys.splice(index, 1)
      index = -1
    }
  }
  return datesObject
}

function sortNumberArray(numberArray) {
  // Sorts numbers and gets the highest priority
  let sortedArray = numberArray.sort()
  let highesValue = sortedArray[0]
  changeBackgroundColorOfUrgencyImg(sortedArray[0])
  changeUrgencyImg(highesValue)
}

function changeBackgroundColorOfUrgencyImg(highesValue) {
  let urgencyImgContainer = document.getElementById('urgencyImgContainer')

  switch (highesValue) {
    case 1: urgencyImgContainer.style = "background-color:  var(--button-urgent)"; break;
    case 2: urgencyImgContainer.style = "background-color:  var(--button-medium)"; break;
    case 3: urgencyImgContainer.style = "background-color:  var(--button-low)"; break;
  }
}

function changeUrgencyImg(highesValue) {
  // filter which urgency image should be displayed
  let urgencyImg = document.getElementById('urgencyImg')
  switch (highesValue) {
    case 1:
      urgencyImg.src = "../assets/svg/double_arrow_up.svg"
      break
    case 2:
      urgencyImg.src = "../assets/svg/double_lines.svg"
      break
    case 3:
      urgencyImg.src = "../assets/svg/double_arrow_down.svg"
      break
  }
}

function checkState(datesObject, taskState, index, objectToArray) {
  // Push task’s date and priority if it's not "done"
  if ("done" == taskState) {
    return
  } else {
    let dateToPush = objectToArray[index][1].date
    datesObject.dates.push(dateToPush)
    datesObject.prioritys.push(objectToArray[index][1].priority)
    return datesObject
  }
}

function filterNextUpcomingDeadline(datesObject, responseToJson) {
  // Filters for next upcoming deadline and for missed deadLines
  let nextUpcomingDeadlineArray = datesObject.dates.filter(verifyTheRightDate);
  if (nextUpcomingDeadlineArray.length == 0 && datesObject.dates.length == 0) {
    stringIfNoDateFound(nextUpcomingDeadlineArray)
  } else if (nextUpcomingDeadlineArray.length == 0 && datesObject.dates.length > 0) {
    nextUpcomingDeadlineArray = missedDeadlineCall(nextUpcomingDeadlineArray, datesObject)
  }
  let sortedArray = nextUpcomingDeadlineArray.sort();
  let nextUpcomingDeadline = sortedArray[0]
  countNextDeadlineDate(sortedArray, datesObject)
  getHighestPriority(datesObject, nextUpcomingDeadline)
  getDateFromDataBankAndChangeFormat(nextUpcomingDeadline, responseToJson);
}

function changeHtmlForMissedDeadlines() {
  // changes Html Text in DeadlineBox p element
  let deadLineText = document.getElementById('deadLineText')
  deadLineText.innerHTML = "";
  deadLineText.innerHTML = "Missed Deadline"
}

function missedDeadlineCall(nextUpcomingDeadlineArray, datesObject) {
  changeHtmlForMissedDeadlines()
  return nextUpcomingDeadlineArray = datesObject.dates
}

function countNextDeadlineDate(sortedArray) {
  // Counts how many tasks share the same nearest deadline
  let deadLineCount = 0
  for (let index = 0; index < sortedArray.length; index++) {
    if (sortedArray[0] == sortedArray[index] && sortedArray[0] !== "Nothing to worry") {
      deadLineCount++
    }
  }
  changeInnerHTMlOfUrgencyBox(deadLineCount)
}

function changeInnerHTMlOfUrgencyBox(deadLineCount) {
  // Updates the deadline count in the urgency box
  let urgencyCountHTml = document.getElementById("urgencyCountBox");
  urgencyCountHTml.innerHTML = "";
  urgencyCountHTml.innerHTML = deadLineCount;
}

function verifyTheRightDate(date) {
  // Checks if a date is today or in the future
  const now = new Date();
  const nowDay = now.getDate();
  const nowYear = now.getFullYear();
  let nowMonth = now.getMonth() + 1;
  let formatedDate

  if (nowMonth < 10) {
    formatedDate = nowYear + "-" + "0" + nowMonth + "-" + nowDay
  } else {
    formatedDate = nowYear + "-" + nowMonth + "-" + nowDay
  }
  return date >= formatedDate
}

function getDateFromDataBankAndChangeFormat(deadLineDate) {
  // Converts deadline into "Month Day, Year" format
  let newFormat
  if (deadLineDate !== "Nothing to worry") {
    let date = new Date(deadLineDate);
    let calculatedMonth = date.getMonth();
    let year = date.getFullYear();
    let day = date.getDate();
    newFormat = responseToJson.months[calculatedMonth] + " " + day + ", " + year;
  } else {
    newFormat = deadLineDate
  }
  changeInnerHtmlForDeadline(newFormat);
}

function changeInnerHtmlForDeadline(nextUpcomingDeadline) {
  // Updates deadline text in the urgency box
  let urgencyDeadlineDate = document.getElementById("urgencyDeadline");
  urgencyDeadlineDate.innerHTML = "";
  urgencyDeadlineDate.innerHTML = nextUpcomingDeadline;
}

function changeInnerHtmlOfSummary(countStatesObj) {
  // Updates task counts in summary boxes
  let idArray = ["progressCountBox", "toDoNumberBox", "doneNumberBox", "awaitFreedbackCountBox"]
  let objectToArray = Object.entries(countStatesObj)

  for (let index = 0; index < idArray.length; index++) {
    let hTmlId = document.getElementById(`${idArray[index]}`);
    hTmlId.innerHTML = "";
    hTmlId.innerHTML = objectToArray[index][1];
  }

  let allTaskCount = document.getElementById("allTaskCountBox");
  allTaskCount.innerHTML = "";
  allTaskCount.innerHTML = calcAllTasksInBoard(countStatesObj);
}

function calcAllTasksInBoard(countStatesObj) {
  // Returns total number of tasks
  let allTaskCount = countStatesObj.progressCount + countStatesObj.toDoCount + countStatesObj.doneCount + countStatesObj.awaitFeedbackCount;

  return allTaskCount;
}

function boxListener() {
  // Adds click event to summary boxes -> redirects to board.html
  const summaryBoxes = document.getElementsByClassName("summaryBox");
  for (let index = 0; index < summaryBoxes.length; index++) {
    summaryBoxes[index].addEventListener("click", () => {
      window.location.href = "../html/board.html";
    });
  }
}