

function init() {
    includeHTML()
    getData()
}



async function getData() {
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

    for (let index = 0; index < responseToJson.tasks.length; index++) {
        let status = responseToJson.tasks[index].state
        let urgency = responseToJson.tasks[index].priority
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
            // changeDateOfUrgentDeadLine(responseToJson.tasks[index].date)

        }
        const now = new Date();
        const day = now.getDay(); // returns a number representing the day of the week, starting with 0 for Sunday
        const hours = now.getHours();
        const minutes = now.getMinutes();
        console.log(`Today is day ${day} and the time is ${hours}:${minutes}.`);
        changeInnerHtmlOfSummary(progressCount, toDoCount, doneCount, awaitFeedbackCount, urgencyCount)
    }
}

function changeDateOfUrgentDeadLine(date) {
    let urgencyDeadlineDate = document.getElementById('urgencyDeadline')
    urgencyDeadlineDate.innerHTML = "";
    urgencyDeadlineDate.innerHTML = date
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

// async function postData() {
//     const BASE_URL = 'https://fir-f30ab-default-rtdb.europe-west1.firebasedatabase.app/tasks.json'

//     let response = await fetch(BASE_URL, {
//         method: 'PUT',
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             "beschreibung": "Login-Seite mit HTML und CSS erstellen",
//             "dringlichkeit": "hoch",
//             "status": "in progress"
//         },
//             {
//                 "beschreibung": "Bug im JavaScript-Code für das Formular beheben",
//                 "dringlichkeit": "mittel",
//                 "status": "to do"
//             },
//             {
//                 "beschreibung": "API-Verbindung zu Firebase testen",
//                 "dringlichkeit": "hoch",
//                 "status": "await feedback"
//             },
//             {
//                 "beschreibung": "Dokumentation für Projekt schreiben",
//                 "dringlichkeit": "niedrig",
//                 "status": "to do"
//             },
//             {
//                 "beschreibung": "Design für Startseite überarbeiten",
//                 "dringlichkeit": "mittel",
//                 "status": "done"
//             }
//         )
//     })
//         .then(response => response.json())
//         .then(response => console.log(JSON.stringify(response)))
// }