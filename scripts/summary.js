

function init() {
    includeHTML()
    getData()
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
            changeDateOfUrgentDeadLine(tasks)
        }
    }
    filterNextUpcomingDeadline(datesArray)
    changeInnerHtmlOfSummary(progressCount, toDoCount, doneCount, awaitFeedbackCount, urgencyCount)
}

function filterNextUpcomingDeadline(datesArray) {
    datesArray.sort()
    console.log(datesArray);

}

// function checkUpcomingDeadline(date) {
//     return date <= 
// }

function changeDateOfUrgentDeadLine(tasks) {
    // let urgencyDeadlineDate = document.getElementById('urgencyDeadline')
    // urgencyDeadlineDate.innerHTML = "";
    // urgencyDeadlineDate.innerHTML = date

    console.log("tasks:", tasks[1].date < tasks[3].date);

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


document.getElementById("summaryContainer").addEventListener("click", () => {
    window.location.href = "../html/board.html";
});


async function postData() {
    const ArneBASE_URL = 'https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/tasks.json'

    let response = await fetch(ArneBASE_URL, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([
            {
                "priority": "hoch",
                "title": "Backend-Verbindung aufbauen",
                "description": "Eine funktionierende Verbindung zwischen server.js und main.js herstellen, um Highscores in einer JSON-Datei zu speichern und abzurufen.",
                "state": "toDo",
                "date": "2025-09-12",
                "assignedContacts": ["Max Mustermann"],
                "category": "technical task",
                "subtasks": [
                    { "title": "server.js vorbereiten", "state": "toDo" },
                    { "title": "API-Endpunkte testen", "state": "toDo" },
                    { "title": "main.js anbinden", "state": "toDo" }
                ]
            },
            {
                "priority": "mittel",
                "title": "Als Nutzer möchte ich die Webseite auch mobil gut bedienen können",
                "description": "Das Layout der Webseite soll auf mobilen Geräten übersichtlicher und einfacher nutzbar sein.",
                "state": "in progress",
                "date": "2025-09-05",
                "assignedContacts": ["Anna Beispiel"],
                "category": "userStory",
                "subtasks": [
                    { "title": "Responsive Breakpoints prüfen", "state": "toDo" },
                    { "title": "Navigation anpassen", "state": "in progress" },
                    { "title": "Footer überarbeiten", "state": "toDo" }
                ]
            },
            {
                "priority": "hoch",
                "title": "Fehler im Spiel beheben",
                "description": "Ein Bug sorgt dafür, dass nach 'Game Over' das Spiel nicht korrekt neu gestartet wird.",
                "state": "await feedback",
                "date": "2025-09-08",
                "assignedContacts": ["Max Mustermann", "Lena Test"],
                "category": "technical task",
                "subtasks": [
                    { "title": "Restart-Funktion prüfen", "state": "done" },
                    { "title": "Variablen-Reset einbauen", "state": "in progress" },
                    { "title": "Leertaste-Event testen", "state": "toDo" }
                ]
            },
            {
                "priority": "niedrig",
                "title": "Als Entwickler möchte ich eine Dokumentation haben",
                "description": "Die Projekt-Dokumentation soll mit Beispielen und Screenshots erweitert werden, damit andere Entwickler den Code besser verstehen.",
                "state": "toDo",
                "date": "2025-09-07",
                "assignedContacts": ["Anna Beispiel"],
                "category": "userStory",
                "subtasks": [
                    { "title": "README aktualisieren", "state": "toDo" },
                    { "title": "Screenshots hinzufügen", "state": "toDo" },
                    { "title": "Beispielcode einfügen", "state": "toDo" }
                ]
            },
            {
                "priority": "mittel",
                "title": "Server online stellen",
                "description": "Die eigene Webseite soll auf einem Server hochgeladen und öffentlich zugänglich gemacht werden.",
                "state": "done",
                "date": "2025-09-10",
                "assignedContacts": ["Max Mustermann"],
                "category": "technical task",
                "subtasks": [
                    { "title": "Server konfigurieren", "state": "done" },
                    { "title": "Dateien hochladen", "state": "done" },
                    { "title": "Domain verknüpfen", "state": "done" }
                ]
            }
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
