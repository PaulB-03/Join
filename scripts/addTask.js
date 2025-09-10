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

            let subtasks = Array.from(document.querySelectorAll(".subtaskTitle"))
                                .map(el => el.textContent.trim())
                                .filter(txt => txt !== "");

            await saveTask(`tasks/${nextIndex}`, {
                "title": title.value,
                "description": description.value,
                "date": date.value,
                "state": "toDo",
                "priority": selectedPrio,
                "category": selectedCategory,
                "assignedContacts": assignedContacts,
                "subtasks": subtasks
            });

            const overlay = document.createElement('div');
            overlay.classList.add('task-added-overlay');
            document.body.appendChild(overlay);
    
            const messageDiv = document.createElement('div');
            messageDiv.textContent = "TASK ADDED TO BOARD";
            messageDiv.classList.add('task-added-message');
            document.body.appendChild(messageDiv);
            setTimeout(() => {
                document.body.removeChild(messageDiv);
                document.body.removeChild(overlay);

                window.location.href = 'board.html';
            }, 2000);

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
    const setValue = (selector, value = "") => {
        const el = document.querySelector(selector);
        if (el) el.value = value;
    };

    const setText = (selector, text = "") => {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    };

    const setHTML = (selector, html = "") => {
        const el = document.querySelector(selector);
        if (el) el.innerHTML = html;
    };

    const setStyle = (selector, prop, value) => {
        const el = document.querySelector(selector);
        if (el) el.style[prop] = value;
    };

    const removeClasses = (selector, ...classes) => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.remove(...classes);
        });
    };

    setValue("#titleInput");
    const titleInput = document.querySelector("#titleInput");
    if (titleInput) titleInput.classList.remove("filled");

    setValue("#descriptionInput");
    setValue("#date");

    removeClasses(".prioGrade", "isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont");
    removeClasses(".prioGrade .prioImage", "filterWhite");
    selectedPrio = "";

    selectedCategory = "";
    setText("#categoryPlaceholder", "Select task category");
    removeClasses("#assignedToDropdownCategory", "selected-red");
    document.querySelectorAll("#dropdown-list-category input[type='checkbox']").forEach(cb => cb.checked = false);

    assignedContacts = [];
    selectedContact = "";
    setHTML("#assignedToInitials");
    setText("#assignedToDropdownContacts .dropdown-selected span", "Select contact");
    setStyle("#assignedToDropdownContacts", "backgroundColor", "white");
    setHTML("#dropdown-list-contacts");
    setValue(".input-subtask");
    setStyle(".subtask-images-container", "display", "none");
    setHTML(".addedSubtaskWrapper");

    if (typeof loadContacts === "function") {
        loadContacts();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("contactSearch").addEventListener("input", function () {
        const query = this.value.toLowerCase();

        const filteredContacts = allContacts.filter(name => name.toLowerCase().includes(query));

        if (window.loadedContacts) {
            renderContacts(filteredContacts, window.loadedContacts);
        }
    });
    loadContacts();
});

async function loadContacts() {
    loadContactsInAddTask();
}

function renderContacts(contactNames, contacts) {
    const contactList = document.getElementById("dropdown-list-contacts");
    contactList.innerHTML = "";

    contactNames.forEach((name) => {
        const contactEntry = Object.values(contacts).find(c => c.name === name);
        if (!contactEntry) return;

        const li = document.createElement("li");
        li.classList.add("dropdown-item-contact");

        const label = document.createElement("label");
        label.classList.add("dropdown-checkbox");

        const initials = contactEntry.name.split(" ").map(w => w[0]).join("").toUpperCase();
        const initialsSpan = document.createElement("span");
        initialsSpan.textContent = initials;
        initialsSpan.classList.add("contact-initial");
        initialsSpan.style.backgroundColor = getColorForName(contactEntry.name);

        const nameSpan = document.createElement("span");
        nameSpan.textContent = contactEntry.name;
        nameSpan.classList.add("contact-name");

        const checkboxImg = document.createElement("img");
        checkboxImg.src = assignedContacts.includes(contactEntry.name)
            ? "../assets/svg/checked.svg"
            : "../assets/svg/check_button.svg";
        checkboxImg.classList.add("checkbox-svg");

        label.addEventListener("click", (e) => {
            e.stopPropagation();

            const isChecked = checkboxImg.src.includes("checked.svg");
            if (isChecked) {
                checkboxImg.src = "../assets/svg/check_button.svg";
            } else {
                checkboxImg.src = "../assets/svg/checked.svg";
            }

            toggleContact(contactEntry.name);
        });

        label.appendChild(initialsSpan);
        label.appendChild(nameSpan);
        label.appendChild(checkboxImg);

        li.appendChild(label);
        contactList.appendChild(li);
    });
}

function updateDropdownText() {
    const span = document.querySelector("#assignedToDropdownContacts .dropdown-selected span");

    if (!span) return;

    if (assignedContacts.length === 0) {
        span.textContent = "Select contacts";
        return;
    }

    let displayed = [];
    for (let i = 0; i < assignedContacts.length; i++) {
        displayed.push(assignedContacts[i]);
        span.textContent = displayed.join(", ");
        if (span.scrollWidth > span.clientWidth) {
            displayed.pop();
            break;
        }
    }
    span.textContent = displayed.join(", ");
}

function toggleContact(name) {
    if (assignedContacts.includes(name)) {
        assignedContacts = assignedContacts.filter(c => c !== name);
    } else {
        assignedContacts.push(name);
    }

    updateDropdownText();
    renderAssignedContacts();
    updateDropdownHighlight();
}

function renderAssignedContacts() {
    let initialsDiv = document.getElementById("assignedToInitials");
    initialsDiv.innerHTML = "";

    const total = assignedContacts.length;
    if (total === 0) {
        initialsDiv.style.display = "none";
        return;
    }

    initialsDiv.style.display = "flex";

    const maxVisible = 3;
    const visibleCount = Math.min(total, maxVisible);

    for (let i = 0; i < visibleCount; i++) {
        let contactName = assignedContacts[i];
        let initials = contactName.split(" ").map(w => w[0]).join("").toUpperCase();
        let span = document.createElement("span");
        span.textContent = initials;
        span.classList.add("contact-initial");
        span.style.backgroundColor = getColorForName(contactName);
        initialsDiv.appendChild(span);
    }

    if (total > maxVisible) {
        let moreCount = total - maxVisible;
        let moreSpan = document.createElement("span");
        moreSpan.textContent = `+${moreCount}`;
        moreSpan.classList.add("contact-initial", "more-count");
        moreSpan.style.backgroundColor = "#999";
        initialsDiv.appendChild(moreSpan);
    }
}

function getColorForName(name) {
    const colors = [
        "#FF5733", "#33FF57", "#3357FF", "#FF33A8",
        "#FF8C33", "#33FFF5", "#8D33FF", "#FFC733",
        "#33FF8C", "#FF3333", "#33A8FF", "#A833FF"
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash % colors.length);
    return colors[index];
}

function updateDropdownHighlight() {
    const dropDown = document.getElementById('dropdown-list-contacts');
    const labels = dropDown.querySelectorAll("label.dropdown-checkbox");

    labels.forEach(label => {
        const name = label.querySelector("span.contact-name").textContent.trim();
        const checkboxImg = label.querySelector("img.checkbox-svg");
        if (assignedContacts.includes(name)) {
            checkboxImg.src = "../assets/svg/checked.svg";
            label.style.color = "lightgrey";
        } else {
            checkboxImg.src = "../assets/svg/check_button.svg";
            label.style.color = "";
        }
    });
}

window.addEventListener("load", () => {
    loadContacts();
});

document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('titleInput');

  titleInput.addEventListener('input', () => {
    if (titleInput.value.trim() !== "") {
      titleInput.classList.add('filled');
    } else {
      titleInput.classList.remove('filled');
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
});

let subtasksElement = null;
let subtasksOriginalStyles = {};

function toggleCategoryDropdown() {
    const dropdown = document.getElementById("assignedToDropdownCategory");
    dropdown.classList.toggle("open");

    if (!subtasksElement) {
        subtasksElement = document.getElementById("subtasks");
        // store original styles
        subtasksOriginalStyles = {
            marginTop: subtasksElement.style.marginTop || "0px",
            paddingBottom: subtasksElement.style.paddingBottom || "50px"
        };
    }

    if (dropdown.classList.contains("open")) {
        // open → move down smoothly
        subtasksElement.style.marginTop = "80px";
        subtasksElement.style.paddingBottom = "50px"; // optional if you want same padding
    } else {
        // close → return smoothly
        subtasksElement.style.marginTop = subtasksOriginalStyles.marginTop;
        subtasksElement.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
    }
}