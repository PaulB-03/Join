

function init() {
    includeHTML()
    getDataForTasks()
    getCurrentTime()
    greetingForNameOrGuest()
}

function getCurrentTime() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    changeInnerHtmlOfSummaryGreeting(hours + "." + minutes)
}

function greetingForNameOrGuest() {
    let logInName = document.getElementById('logInName').innerHTML
    let markDestinction = document.getElementById('markDestinction')

    if (logInName.length < 1) {
        markDestinction.innerHTML = "!"
    } else {
        markDestinction.innerHTML = ","
    }
}

function changeInnerHtmlOfSummaryGreeting(hours) {
    let sumGreeting = document.getElementById('sumGreeting')
    sumGreeting.innerHTML = "";

    if (hours <= 12) {
        sumGreeting.innerHTML = "Good morning"
    } else
        if (hours >= 12 && hours < 18) {
            sumGreeting.innerHTML = "Good afternoon"
        } else {
            sumGreeting.innerHTML = "Good evening"
        }
}

async function getDataForTasks() {
    const BASE_URL = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

    let response = await fetch(BASE_URL + ".json");
    responseToJson = await response.json()

    console.log(responseToJson);
    countForSummary(responseToJson)
}

function countForSummary(responseToJson) {
    let progressCount = 0;
    let toDoCount = 0;
    let doneCount = 0;
    let awaitFeedbackCount = 0;
    let urgencyCount = 0;
    let datesArray = [];

    for (let index = 0; index < responseToJson.tasks.length; index++) {
        let status = responseToJson.tasks[index].state
        let urgency = responseToJson.tasks[index].priority
        datesArray.push(responseToJson.tasks[index].date)
        if (status == "in progress") {
            progressCount += 1
        }
        if (status == "toDo") {
            toDoCount += 1
        }
        if (status == "done") {
            doneCount += 1
        }
        if (status == "await feedback") {
            awaitFeedbackCount += 1
        }
        if (urgency == "hoch") {
            urgencyCount += 1
            tasks = responseToJson.tasks
        }
    }
    filterNextUpcomingDeadline(datesArray, responseToJson)
    changeInnerHtmlOfSummary(progressCount, toDoCount, doneCount, awaitFeedbackCount, urgencyCount)
}

function filterNextUpcomingDeadline(datesArray, responseToJson) {
    datesArray.sort()
    let nextUpcomingDeadline = datesArray[0]

    getDateFromDataBankAndChangeFormat(nextUpcomingDeadline, responseToJson)
}

function getDateFromDataBankAndChangeFormat(deadLineDate) {
    let date = new Date(deadLineDate)
    let calculatedMonth = date.getMonth()
    let year = date.getFullYear()
    let day = date.getDay()
    let newFormat = responseToJson.months[calculatedMonth] + " " + day + ", " + year
    changeInnerHtmlForDeadline(newFormat)
}

function changeInnerHtmlForDeadline(nextUpcomingDeadline) {
    let urgencyDeadlineDate = document.getElementById('urgencyDeadline')
    urgencyDeadlineDate.innerHTML = "";
    urgencyDeadlineDate.innerHTML = nextUpcomingDeadline
}

function changeInnerHtmlOfSummary(progressCount, toDoCount, doneCount, awaitFeedbackCount, urgencyCount) {
    let toDoNumberHTml = document.getElementById('toDoNumberBox')
    toDoNumberHTml.innerHTML = "";
    toDoNumberHTml.innerHTML = toDoCount;

    let doneNumberHTml = document.getElementById('doneNumberBox')
    doneNumberHTml.innerHTML = "";
    doneNumberHTml.innerHTML = doneCount;

    let progressCountHTml = document.getElementById('progressCountBox')
    progressCountHTml.innerHTML = "";
    progressCountHTml.innerHTML = progressCount;

    let awaitFreedbackCountHTml = document.getElementById('awaitFreedbackCountBox')
    awaitFreedbackCountHTml.innerHTML = "";
    awaitFreedbackCountHTml.innerHTML = awaitFeedbackCount;

    let urgencyCountHTml = document.getElementById('urgencyCountBox')
    urgencyCountHTml.innerHTML = "";
    urgencyCountHTml.innerHTML = urgencyCount;

    let allTaskCount = document.getElementById('allTaskCountBox')
    allTaskCount.innerHTML = "";
    allTaskCount.innerHTML = calcAllTasksInBoard(progressCount, toDoCount, doneCount, awaitFeedbackCount);
}

function calcAllTasksInBoard(progressCount, toDoCount, doneCount, awaitFeedbackCount) {
    let allTaskCount = progressCount + toDoCount + doneCount + awaitFeedbackCount

    return allTaskCount
}

const summaryBoxes = document.getElementsByClassName("summaryBox")
for (let index = 0; index < summaryBoxes.length; index++) {

    summaryBoxes[index].addEventListener("click", () => {
        window.location.href = "../html/board.html";
    });
}


async function postData() {
    const BASE_URL = 'https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/months.json'

    let response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([
            "Januar",
            "Februar",
            "März",
            "April",
            "Mai",
            "Juni",
            "Juli",
            "August",
            "September",
            "Oktober",
            "November",
            "Dezember"
        ]
        )
    })
        .then(response => response.json())
        .then(response => console.log(JSON.stringify(response)))
}

[
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember"
]
