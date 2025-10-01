let baseURL = 'https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/';
// all the colors for the contact profile pictures
const COLOR_VARS = [
  "--contact-bg-blue",
  "--contact-bg-light-blue",
  "--contact-bg-light-green",
  "--contact-bg-purple",
  "--contact-bg-lilac",
  "--contact-bg-green",
  "--contact-bg-pink",
  "--contact-bg-red",
  "--contact-bg-rose",
  "--contact-bg-peach",
  "--contact-bg-orange",
  "--contact-bg-light-orange",
  "--contact-bg-dark-yellow",
  "--contact-bg-medium-yellow",
  "--contact-bg-yellow",
];


// call this function with a name (string of first and last name) to get the initials
// gets the initials for the profile picture,  called by contactRow
function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// call this function with a name (string of first and last name) to get a color
// function to give the same color for the same name everytime, called by contactRow
function colorForName(name = "") {
  //use empty string if no name is found
  const sum = [...name.trim().toLowerCase()] //convert name to lower case letters and split into characters
    .reduce((acc, ch) => acc + ch.codePointAt(0), 0); // sum the unicode values of each character
  return `var(${COLOR_VARS[sum % COLOR_VARS.length]})`; // use the sum from the unicode values to select a color
}

// Modify loadContacts to store contacts globally for search render
async function loadContactsInAddTask() {
    try {
        let response = await fetch(baseURL + "contacts.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let contacts = await response.json();

        window.loadedContacts = contacts; // store globally for search

        allContacts = [];
        const contactList = document.getElementById("dropdown-list-contacts");
        contactList.innerHTML = "";

        if (contacts) {
            const sortedContacts = Object.entries(contacts).sort((a, b) => {
                const nameA = a[1].name.toUpperCase();
                const nameB = b[1].name.toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });

            sortedContacts.forEach(([key, contact], index) => {
                allContacts.push(contact.name);
            });

            renderContacts(allContacts, contacts);
        }
    } catch (error) {
        console.error("Could not load contacts: ", error);
    }
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
        initialsSpan.style.backgroundColor = colorForName(contactEntry.name);

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

let subtasksContainer = null;
let subtasksOriginalStyles = {};

function toggleCategoryDropdown() {
    const dropdown = document.getElementById("assignedToDropdownCategory");
    dropdown.classList.toggle("open");

    if (!subtasksContainer) {
        subtasksContainer = document.getElementById("subtasks");
        subtasksOriginalStyles = {
            marginTop: subtasksContainer.style.marginTop || "0px",
            paddingBottom: subtasksContainer.style.paddingBottom || "50px"
        };
    }

    if (dropdown.classList.contains("open")) {
        subtasksContainer.style.marginTop = "80px";
        subtasksContainer.style.paddingBottom = "50px";
    } else {
        subtasksContainer.style.marginTop = subtasksOriginalStyles.marginTop;
        subtasksContainer.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
    }
}

let categoryContainer, categoryOriginalStyles;

function toggleAssignedDropdown() {
    const dropdown = document.getElementById("assignedToDropdownContacts");
    dropdown.classList.toggle("open");

    if (!subtasksContainer) {
        subtasksContainer = document.getElementById("subtasks");
        if (subtasksContainer) {
            subtasksOriginalStyles = {
                marginTop: subtasksContainer.style.marginTop || "0px",
                paddingBottom: subtasksContainer.style.paddingBottom || "50px"
            };
        }
    }

    if (!categoryContainer) {
        categoryContainer = document.getElementById("category");
        if (categoryContainer) {
            categoryOriginalStyles = {
                marginTop: categoryContainer.style.marginTop || "0px"
            };
        }
    }

    if (dropdown.classList.contains("open")) {
        if (categoryContainer) categoryContainer.style.marginTop = "220px";
        if (subtasksContainer) {
            subtasksContainer.style.marginTop = "20px";
            subtasksContainer.style.paddingBottom = "50px";
        }
    } else {
        if (categoryContainer) categoryContainer.style.marginTop = categoryOriginalStyles.marginTop;
        if (subtasksContainer) {
            subtasksContainer.style.marginTop = subtasksOriginalStyles.marginTop;
            subtasksContainer.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
        }
    }
}

function initCategoryDropdown() {
    const dropdown = document.getElementById('assignedToDropdownCategory');
    const arrow = document.getElementById('dropdown-arrow-subtasks');
    const dropdownList = document.getElementById('dropdown-list-category');
    const items = dropdownList.getElementsByClassName('dropdown-item-category');

    let isOpen = false;

    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        isOpen = !isOpen;
        dropdown.classList.toggle('open', isOpen);
        arrow.style.transform = isOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
    });

    Array.from(items).forEach((item, index) => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            selectCategory(index);
            isOpen = false;
            dropdown.classList.remove('open');
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
        });
    });

    document.addEventListener('click', () => {
        if (isOpen) {
            dropdown.classList.remove('open');
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
            isOpen = false;
        }
    });
}

function selectCategory(index) {
    const categories = ['Userstory', 'Technical Task'];
    const dropdown = document.getElementById("assignedToDropdownCategory");
    const placeholder = document.getElementById("categoryPlaceholder");

    selectedCategory = categories[index];
    placeholder.textContent = selectedCategory;
    dropdown.classList.add('selected-red');

    if (subtasksContainer) {
        subtasksContainer.style.marginTop = subtasksOriginalStyles.marginTop;
        subtasksContainer.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCategoryDropdown();
});

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
        span.style.backgroundColor = colorForName(contactName);
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
    placeholder.textContent = categories[index];
    selectedCategory = categories[index];
    dropdown.classList.add('selected-red');
    dropdown.classList.remove('open');
    if (subtasksContainer) {
        subtasksContainer.style.marginTop = subtasksOriginalStyles.marginTop;
        subtasksContainer.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
    }
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


function saveSelectedCategory(index) {
    const dropdown = document.getElementById("assignedToDropdownCategory");
    const categoryList = document.getElementById("dropdown-list-category");
    dropdown.classList.remove("open");
    if (subtasksContainer) {
        subtasksContainer.style.marginTop = subtasksOriginalStyles.marginTop;
        subtasksContainer.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
    }
    const selectedText = categoryList.children[index].querySelector("label").textContent.trim();
    document.getElementById("categoryPlaceholder").textContent = selectedText;
    dropdown.classList.add("selected");
}

async function loadContactsInAddTask() {
    try {
      const r = await fetch(baseURL + "contacts.json");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const contacts = await r.json();
      const list = document.getElementById("dropdown-list-contacts");
      if (!contacts || !list) return;
      window.loadedContacts = contacts; list.innerHTML = "";
      allContacts = Object.values(contacts).map(c=>c.name).filter(Boolean).sort((a,b)=>a.localeCompare(b));
      renderContacts(allContacts, contacts);
    } catch (e) { console.error("Could not load contacts:", e); }
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