

function init() {
    includeHTML()
    getData()
}



async function getData() {
    const BASE_URL = "https://fir-f30ab-default-rtdb.europe-west1.firebasedatabase.app/";

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

    for (let index = 0; index < responseToJson.tasks.length; index++) {
        let status = responseToJson.tasks[index].status
        if (status == "in progress") {
            progressCount += 1
        }
        if (status == "to do") {
            toDoCount += 1
        }
        if (status == "done") {
            doneCount += 1
        }
        if (status == "await feedback") {
            awaitFeedbackCount += 1
        }
    }
    changeInnerHtmlOfSummary(progressCount, toDoCount, doneCount, awaitFeedbackCount)
}

function changeInnerHtmlOfSummary(progressCount, toDoCount, doneCount, awaitFeedbackCount) {
    let toDoNumberHTml = document.getElementById('toDo')
    toDoNumberHTml.innerHTML = "";
    toDoNumberHTml.innerHTML = toDoCount;
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