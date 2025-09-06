let baseURL = 'https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/';
let prioGrade = "";
let selectedPrio = "";
let selectedCategory = "";
let selectedContact = "";
let allContacts = [];
let assignedContacts = [];

document.addEventListener('DOMContentLoaded', () => {
    initCategoryDropdown();
    initContactsDropdown();
    initialiseSavePrioImg();
});

async function createTask(event) {
    event.preventDefault();
    let title = document.getElementById('titleInput');
    let description = document.getElementById('descriptionInput');
    let date = document.getElementById('date');

    if (title.value && description.value && date.value && selectedPrio && selectedCategory) {
        try {
            let tasks = await getTasks();
            let nextIndex = 0;
            if (tasks) {
                const existingIndices = Object.keys(tasks)
                    .map(key => parseInt(key))
                    .filter(key => !isNaN(key));
                if (existingIndices.length > 0) {
                    nextIndex = Math.max(...existingIndices) + 1;
                }
            }

            await saveTask(`tasks/${nextIndex}`, {
                "title": title.value,
                "description": description.value,
                "date": date.value,
                "state": "toDo",
                "priority": selectedPrio,
                "category": selectedCategory,
                "assignedContacts": assignedContacts
            });

            window.location.href = 'board.html';
        } catch (error) {
            alert("Die Aufgabe konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.");
            console.error("Error saving task:", error);
        }
    } else {
        alert('Bitte alle Felder inkl. Priorität und Kategorie ausfüllen');
    }
}

async function saveTask(path = "", data = {}) {
    let response = await fetch(baseURL + path + ".json", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return await response.json();
}

async function getTasks() {
    try {
        let response = await fetch(baseURL + "tasks.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not get tasks: ", error);
        return null;
    }
}

function initialiseSavePrioImg() {
    let prioRefs = document.getElementsByClassName('prioGrade');
    let prioArray = Array.from(prioRefs);

    prioArray.forEach(element => {
        element.addEventListener('click', () => {
            prioArray.forEach(el => el.classList.remove('isClicked'));
            
            if (element.classList.contains('isClicked')) {
                element.classList.remove('isClicked');
                selectedPrio = "";
            } else {
                element.classList.add('isClicked');
                selectedPrio = element.id;
            }
        });
    });
}

function setPrioColor(index) {
    let prioRefs = document.getElementsByClassName('prioGrade');
    let prioRef = prioRefs[index];
    let images = document.querySelectorAll('.prioGrade .prioImage');
    let prioImg = prioRef.querySelector("img");

    images.forEach(image => image.classList.remove('filterWhite'));
    Array.from(prioRefs).forEach(element => element.classList.remove('whitePrioFont'));
    if (prioRef.classList.contains('redColor') || prioRef.classList.contains('orangeColor') || prioRef.classList.contains('greenColor')) {
        prioRef.classList.remove('orangeColor', 'greenColor', 'redColor');
        return;
    }
    Array.from(prioRefs).forEach(ref => ref.classList.remove('redColor', 'orangeColor', 'greenColor'));
    addBackgroundColor(prioRef, prioImg);
}

function addBackgroundColor(prioRef, prioImg) {
    prioRef.classList.add(
        prioRef.id === "urgent" ? 'redColor' :
            prioRef.id === "medium" ? 'orangeColor' :
                'greenColor',
        addPrioImgColor(prioRef, prioImg),
    );
    prioGrade = prioRef.id;
}

function addPrioImgColor(prioRef, prioImg) {
    prioRef.classList.add('whitePrioFont');
    prioImg.classList.add('filterWhite');
}

function removePrioImgColor(prioRef, prioImg) {
    prioRef.classList.remove('whitePrioFont');
    prioImg.classList.remove('filterWhite');
}

function initCategoryDropdown() {
    let select2 = document.getElementById('assignedToDropdownCategory');
    let arrow2 = document.querySelector('#dropdown-arrow-subtasks');
    let dropDown2 = document.getElementById('dropdown-list-category');
    let dropDownItem2 = document.getElementsByClassName('dropdown-item-category');

    dropdownFunction(arrow2, dropDown2, select2, dropDownItem2, (item) => {
        let name = item.textContent.trim();
        selectedCategory = name;

        document.getElementById("categoryPlaceholder").textContent = name;
    });
}

async function initContactsDropdown() {
    let select = document.getElementById('assignedToDropdownContacts');
    let arrow = document.querySelector('#dropdown-arrow-contacts');
    let dropDown = document.getElementById('dropdown-list-contacts');
    let response = await fetch(baseURL + "contacts.json");
    let contacts = await response.json();

    allContacts = Object.values(contacts).map(contact => contact.name);
    dropDown.innerHTML = "";
    allContacts.forEach(name => {
        let li = document.createElement("li");
        li.classList.add("dropdown-item-contact");
        let isChecked = assignedContacts.includes(name) ? "checked" : "";
        li.innerHTML = `
            <label class="custom-checkbox" style="display: block; padding: 5px; cursor: pointer; ${isChecked ? 'color: lightgrey;' : ''}">
                ${name}
                <input type="checkbox" onchange="toggleContact('${name}'); updateDropdownBackground('assignedToDropdownContacts');" ${isChecked}>
                <span style="display:none"></span>
            </label>
            `;
        dropDown.appendChild(li);
    });

    let items = document.getElementsByClassName("dropdown-item-contact");
    dropdownFunction(arrow, dropDown, select, items, null);
}

function updateDropdownBackground(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  const checked = dropdown.querySelectorAll("input[type='checkbox']:checked").length > 0;

  if (checked) {
    dropdown.classList.add("selected");
  } else {
    dropdown.classList.remove("selected");
  }
}

function dropdownFunction(arrow, dropDown, select, items, onSelect) {
    let isClicked = false;

    select.addEventListener('click', (event) => {
        event.stopPropagation();
        arrow.style.transform = isClicked ? "translateY(-50%) rotate(0deg)" : "translateY(-50%) rotate(180deg)";
        dropDown.style.display = isClicked ? 'none' : 'block';
        isClicked = !isClicked;
    });

    Array.from(items).forEach(item => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            dropDown.style.display = 'none';
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
            isClicked = false;

            if (onSelect) onSelect(item);
        });
    });

    document.body.addEventListener('click', () => {
        if (isClicked) {
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
            dropDown.style.display = 'none';
            isClicked = false;
        }
    });
}

function saveSelectedCategory(index) {
    const categories = ['Userstory', 'Technical Task'];
    const placeholder = document.getElementById('categoryPlaceholder');
    const dropdown = document.getElementById('assignedToDropdownCategory');
    const dropdownList = document.getElementById('dropdown-list-category');
    
    placeholder.textContent = categories[index];
    dropdown.classList.add('selected-red');
    dropdownList.style.display = 'none';
    dropdown.classList.remove('active');
}

function clearTask() {
    document.getElementById('titleInput').value = "";
    document.getElementById('descriptionInput').value = "";
    document.getElementById('date').value = "";

    let prioRefs = document.getElementsByClassName('prioGrade');
    Array.from(prioRefs).forEach(el => {
        el.classList.remove('isClicked', 'redColor', 'orangeColor', 'greenColor', 'whitePrioFont');
    });
    let images = document.querySelectorAll('.prioGrade .prioImage');
    images.forEach(img => img.classList.remove('filterWhite'));
    selectedPrio = "";

    selectedCategory = "";
    document.getElementById("categoryPlaceholder").textContent = "Select task category";
    document.getElementById("assignedToDropdownCategory").classList.remove('selected-red');
    let checkboxes = document.querySelectorAll("#dropdown-list-category input[type='checkbox']");
    checkboxes.forEach(cb => cb.checked = false);

    assignedContacts = [];
    selectedContact = "";
    document.getElementById("assignedToInitials").innerHTML = "";
    document.querySelector("#assignedToDropdownContacts .dropdown-selected span").textContent = "Select contact";
    document.getElementById("assignedToDropdownContacts").style.backgroundColor = "white";

    const dropDown = document.getElementById('dropdown-list-contacts');
    const labels = dropDown.querySelectorAll("label.custom-checkbox");
    labels.forEach(label => {
        label.style.color = "black";
        const checkbox = label.querySelector("input[type='checkbox']");
        if (checkbox) checkbox.checked = false;
    });
}

const dropDown = document.getElementById('dropdown-list-contacts');
if (dropDown) {
    const labels = dropDown.querySelectorAll("label.custom-checkbox");
    labels.forEach(label => {
        label.style.color = "black";
        const checkbox = label.querySelector("input[type='checkbox']");
        if (checkbox) checkbox.checked = false;
    });
}

async function loadContacts() {
    try {
        let response = await fetch(baseURL + "contacts.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let contacts = await response.json();

        let contactList = document.getElementById("dropdown-list-contacts");
        contactList.innerHTML = "";

        if (contacts) {
            Object.entries(contacts).forEach(([key, contact]) => {
                let li = document.createElement("li");
                li.classList.add("dropdown-item-contact");
                li.textContent = contact.name;
                li.onclick = () => saveSelectedContact(contact.name);
                contactList.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Could not load contacts: ", error);
    }
}

function saveSelectedContact(name) {
    selectedContact = name;
    let selectedSpan = document.querySelector("#assignedToDropdownContacts .dropdown-selected span");
    selectedSpan.textContent = name;

    document.getElementById("dropdown-list-contacts").style.display = "none";
    document.querySelector("#dropdown-arrow-contacts").style.transform = "rotate(0deg)";

    renderAssignedContact(name);
}

function renderContactList() {
    const list = document.getElementById("dropdown-list-contacts");
    list.innerHTML = "";
    allContacts.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        if (assignedContacts.includes(name)) {
            li.classList.add("selected-contact");
        }
        li.addEventListener("click", () => toggleContact(name));
        list.appendChild(li);
    });
}

function renderAssignedContact(name) {
    let initialsDiv = document.getElementById("assignedToInitials");
    initialsDiv.style.display = "flex";
    initialsDiv.innerHTML = "";

    let initials = name.split(" ").map(w => w[0]).join("").toUpperCase();
    let span = document.createElement("span");
    span.textContent = initials;
    span.classList.add("contact-initial");
    initialsDiv.appendChild(span);
}

function toggleContact(name) {
    if (assignedContacts.includes(name)) {
        assignedContacts = assignedContacts.filter(c => c !== name);
    } else {
        assignedContacts.push(name);
    }
    let span = document.querySelector("#assignedToDropdownContacts .dropdown-selected span");
    span.textContent = assignedContacts.length > 0
        ? assignedContacts.join(", ")
        : "Select contact";

    renderAssignedContacts();
    updateDropdownHighlight();
}

function renderAssignedContacts() {
    let initialsDiv = document.getElementById("assignedToInitials");
    if (assignedContacts.length === 0) {
        initialsDiv.style.display = "none";
        initialsDiv.innerHTML = "";
        return;
    }

    initialsDiv.style.display = "flex";
    initialsDiv.innerHTML = "";

    assignedContacts.forEach((contactName, index) => {
        let initials = contactName.split(" ").map(w => w[0]).join("").toUpperCase();
        let span = document.createElement("span");
        span.textContent = initials;
        span.classList.add("contact-initial");
        span.style.backgroundColor = getColor(index);
        initialsDiv.appendChild(span);
    });
}

function getColor(index) {
    const colors = ["#f44336", "#2196F3", "#FF9800", "#9C27B0", "#4CAF50", "#00BCD4", "#FFC107"];
    return colors[index % colors.length];
}

function updateDropdownHighlight() {
    const dropDown = document.getElementById('dropdown-list-contacts');
    const labels = dropDown.querySelectorAll("label.custom-checkbox");

    labels.forEach(label => {
        const name = label.textContent.trim();
        const checkbox = label.querySelector("input[type='checkbox']");
        if (assignedContacts.includes(name)) {
            checkbox.checked = true;
            label.style.color = "lightgrey";
        } else {
            checkbox.checked = false;
            label.style.color = "";
        }
    });
}

window.addEventListener("load", () => {
    initContactsDropdown();
});