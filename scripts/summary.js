function initForSummary() {
  sidebarHeaderInit();
  boxListener()
  dataForSummary();
}
function dataForSummary() {
  getDataForTasks();
  getCurrentTime();
  showSummaryGreeting(); // function located in logIn_Malte.js and logIn.js
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  changeInnerHtmlOfSummaryGreeting(hours + "." + minutes);
}

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

async function getDataForTasks() {
  const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

  let response = await fetch(BASE_URL + ".json");
  responseToJson = "";
  responseToJson = await response.json();
  countForSummary(responseToJson);
}

function countForSummary(responseToJson) {
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
  getHighestValue(datesObject)
  stringIfNoDateFound(datesObject)
  filterNextUpcomingDeadline(datesObject, responseToJson);
  changeInnerHtmlOfSummary(countStatesObj);
}

function stringIfNoDateFound(datesObject) {
  if (datesObject.dates.length <= 1) {
    return datesArray.push("Nothing to worry")
  }
}

function getHighestValue(datesObject) {
  let priorityArray = datesObject.prioritys
  let numberArray = []
  for (let index = 0; index < priorityArray.length; index++) {
    let priority = priorityArray[index]
    switch (priority) {
      case "urgent":
        numberArray.push(1)
        break
      case "medium":
        numberArray.push(2)
        break
      case "low":
        numberArray.push(3)
        break
    }
  }
  sortNumberArray(numberArray)
}

function sortNumberArray(numberArray) {
  let sortedArray = numberArray.sort()
  let highesValue = sortedArray[0]
  changeUrgencyImg(highesValue)
}

function changeUrgencyImg(highesValue) {
  // let urgencyImg = document.getElementById('urgencyImg').src
  switch (highesValue) {
    case 1:
      console.log("rot = src = ../assets/svg/double_arrow_up.svg");
      break
    case 2:
      console.log("orange  = src = ../assets/svg/double_lines.svg");
      break
    case 3:
      console.log("grün  = src = ../assets/svg/double_arrow_down.svg");
      break
  }
}

function checkState(datesObject, taskState, index, objectToArray) {
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
  let nextUpcomingDeadlineArray = datesObject.dates.filter(verifyTheRightDate);
  let sortedArray = nextUpcomingDeadlineArray.sort();
  let nextUpcomingDeadline = sortedArray[0]
  countNextDeadlineDate(sortedArray)
  getDateFromDataBankAndChangeFormat(nextUpcomingDeadline, responseToJson);
}

function countNextDeadlineDate(sortedArray) {
  let deadLineCount = 0
  for (let index = 0; index < sortedArray.length; index++) {
    if (sortedArray[0] == sortedArray[index] && sortedArray[0] !== "Nothing to worry") {
      deadLineCount++
    }
  }
  changeInnerHTMlOfUrgencyBox(deadLineCount)
}

function changeInnerHTMlOfUrgencyBox(deadLineCount) {
  let urgencyCountHTml = document.getElementById("urgencyCountBox");
  urgencyCountHTml.innerHTML = "";
  urgencyCountHTml.innerHTML = deadLineCount;
}

function verifyTheRightDate(date) {
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
  let urgencyDeadlineDate = document.getElementById("urgencyDeadline");
  urgencyDeadlineDate.innerHTML = "";
  urgencyDeadlineDate.innerHTML = nextUpcomingDeadline;
}

function changeInnerHtmlOfSummary(countStatesObj) {
  let toDoNumberHTml = document.getElementById("toDoNumberBox");
  toDoNumberHTml.innerHTML = "";
  toDoNumberHTml.innerHTML = countStatesObj.toDoCount;

  let doneNumberHTml = document.getElementById("doneNumberBox");
  doneNumberHTml.innerHTML = "";
  doneNumberHTml.innerHTML = countStatesObj.doneCount;

  let progressCountHTml = document.getElementById("progressCountBox");
  progressCountHTml.innerHTML = "";
  progressCountHTml.innerHTML = countStatesObj.progressCount;

  let awaitFreedbackCountHTml = document.getElementById("awaitFreedbackCountBox");
  awaitFreedbackCountHTml.innerHTML = "";
  awaitFreedbackCountHTml.innerHTML = countStatesObj.awaitFeedbackCount;

  let allTaskCount = document.getElementById("allTaskCountBox");
  allTaskCount.innerHTML = "";
  allTaskCount.innerHTML = calcAllTasksInBoard(countStatesObj);
}

function calcAllTasksInBoard(countStatesObj) {
  let allTaskCount = countStatesObj.progressCount + countStatesObj.toDoCount + countStatesObj.doneCount + countStatesObj.awaitFeedbackCount;

  return allTaskCount;
}
function boxListener() {
  const summaryBoxes = document.getElementsByClassName("summaryBox");
  for (let index = 0; index < summaryBoxes.length; index++) {
    summaryBoxes[index].addEventListener("click", () => {
      window.location.href = "../html/board.html";
    });
  }
}

async function postData() {
  const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/months.json";

  let response = await fetch(BASE_URL, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]),
  })
    .then((response) => response.json())
    .then((response) => console.log(JSON.stringify(response)));
}
