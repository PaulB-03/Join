
async function findTask() {
    let taskToFind = document.getElementById('taskSearchInput').value
    let toLowerCaseValue = taskToFind.toLowerCase();
    let capiFirstletter = capitalizeFirstLetter(taskToFind)
    let tasks = await getTasks();
    let arrayForFiltering = changeObjectToArray(tasks)
    let foundTasksArray = []
    let valuesToFind = [capiFirstletter, toLowerCaseValue]

    if (taskToFind.length > 1 && isNaN(taskToFind)) {
        for (let index = 0; index < valuesToFind.length; index++) {
            let foundTasks = filterArray(valuesToFind[index], arrayForFiltering)
            foundTasks.forEach(element => foundTasksArray.push(element));
        }
        getIdsOfTasks(foundTasksArray)
    } else {
        init()
    }
}

function getIdsOfTasks(foundTasksArray) {
    let idArray = []
    for (let index = 0; index < foundTasksArray.length; index++) {
        let id = getLastElement(foundTasksArray, index)
        idArray.push(id)
    }
    getSingleTask(idArray)
}

async function getSingleTask(idArray) {
    let taskArray = []
    for (let index = 0; index < idArray.length; index++) {
        let singletask = await fetchSingleTask(idArray[index])
        let id = idArray[index]
        taskArray[id] = singletask
    }
   renderFoundTasks(taskArray)
}

async function renderFoundTasks(taskArray) {
    clearColumns();
    Object.entries(taskArray).forEach(([id, t]) => addTaskCard(id, t));
    updateAllEmptyStates();
}

function filterArray(value, arrayForFiltering) {
    let foundtasks = arrayForFiltering.filter(name => name.includes(value))
    return foundtasks
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function getLastElement(arr, index) {
    return arr[index].split(",").pop();
}

function debounce(func, timeout = 1000) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

let processChanges = debounce(() => findTask());

function changeObjectToArray(tasksResponse) {
    let objectToArray = Object.entries(tasksResponse)

    let arrayForFiltering = []

    for (let index = 0; index < objectToArray.length; index++) {

        arrayForFiltering.push(objectToArray[index][1].title + ", " + objectToArray[index][1].description + ", " + objectToArray[index][1].assignedContacts + "," + `${objectToArray[index][0]}`)

    }
    return arrayForFiltering
}