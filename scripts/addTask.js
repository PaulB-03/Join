let prioGrade = "";
let selectedPrio = "";
let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
let assignedContacts = [];

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
      'greenColor'
  );
  addPrioImgColor(prioRef, prioImg);
  selectedPrio = prioRef.id;
}

function getSelectedPriority() {
  return typeof selectedPrio !== "undefined" ? selectedPrio : null;
}

function addPrioImgColor(prioRef, prioImg) {
  prioRef.classList.add('whitePrioFont');
  prioImg.classList.add('filterWhite');
}

function removePrioImgColor(prioRef, prioImg) {
  prioRef.classList.remove('whitePrioFont');
  prioImg.classList.remove('filterWhite');
}

async function createTask() {
  let title = document.getElementById('titleInput');
  let description = document.getElementById('descriptionInput');
  let date = document.getElementById('date');

  function clearErrors() {
      [title, description, date].forEach(input => {
          input.style.border = '';
          const nextElem = input.nextElementSibling;
          if (nextElem && nextElem.classList.contains('error-message')) nextElem.remove();
      });

      const prioElem = document.getElementById('priorityInput');
      if (prioElem) {
          prioElem.style.border = '';
          const nextElem = prioElem.nextElementSibling;
          if (nextElem && nextElem.classList.contains('error-message')) nextElem.remove();
      }
      const categoryElem = document.getElementById('categoryInput');
      if (categoryElem) {
          categoryElem.style.border = '';
          const nextElem = categoryElem.nextElementSibling;
          if (nextElem && nextElem.classList.contains('error-message')) nextElem.remove();
      }
  }
  clearErrors();

  let isValid = true;
  function showError(inputElem) {
      inputElem.style.border = '2px solid red';
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'This field is required';
      errorMsg.classList.add('error-message');
      errorMsg.style.color = 'red';
      errorMsg.style.fontSize = '0.8em';
      errorMsg.style.marginTop = '4px';
      inputElem.insertAdjacentElement('afterend', errorMsg);
  }
  if (!title.value.trim()) { showError(title); isValid = false; }
  if (!description.value.trim()) { showError(description); isValid = false; }
  if (!date.value.trim()) { showError(date); isValid = false; }

  if (!document.getElementById('assignedToInitials')) {
    const contactElem = document.getElementById('assignedToDropdownContacts');
    if (contactElem) showError(contactElem);
    isValid = false;
  }
  if (!selectedCategory) {
    const categoryElem = document.getElementById('assignedToDropdownCategory');
    if (categoryElem) showError(categoryElem);
    isValid = false;
  }
  if (!isValid) return;

  try {
      let tasks = await getTasks?.(); // optional
      if (tasks) {
          const existingIndices = Object.keys(tasks).map(key => parseInt(key)).filter(key => !isNaN(key));
          void existingIndices; // nur um Lint zu beruhigen
      }
      let subtasks = Array.from(document.querySelectorAll(".subtaskTitle"))
                          .map(el => el.textContent.trim())
                          .filter(txt => txt !== "");

      await saveTask(`tasks`, {
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
      messageDiv.classList.add('task-added-message');

      const textSpan = document.createElement('span');
      textSpan.textContent = "TASK ADDED TO BOARD";
      textSpan.style.verticalAlign = "middle";
      messageDiv.appendChild(textSpan);

      const img = document.createElement('img');
      img.src = "../assets/svg/board.svg";
      img.alt = "Board icon";
      img.style.width = "24px";
      img.style.height = "24px";
      img.style.display = "inline-block";
      img.style.marginLeft = "10px";
      img.style.verticalAlign = "middle";
      messageDiv.appendChild(img);

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
}

async function saveTask(path = "", data = {}) {
  let response = await fetch(baseURL + path + ".json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
  });
  return await response.json();
}

function getSelectedContacts() {
  return Array.isArray(assignedContacts) ? assignedContacts : [];
}

function getSubtasksFromForm() {
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  if (!wrapper) return [];
  const items = wrapper.querySelectorAll(".subtask, .subtaskTitle");
  const subtasks = [];
  items.forEach((el) => {
    const text = el.textContent.trim();
    if (text) {
      const done = el.querySelector("input[type=checkbox]")?.checked || false;
      subtasks.push({ text, done });
    }
  });
  return subtasks;
}

function clearTask() {
  const setValue = (selector, value = "") => { const el = document.querySelector(selector); if (el) el.value = value; };
  const setText  = (selector, text = "")   => { const el = document.querySelector(selector); if (el) el.textContent = text; };
  const setHTML  = (selector, html = "")   => { const el = document.querySelector(selector); if (el) el.innerHTML = html; };
  const setStyle = (selector, prop, value) => { const el = document.querySelector(selector); if (el) el.style[prop] = value; };
  const removeClasses = (selector, ...classes) => {
      document.querySelectorAll(selector).forEach(el => el.classList.remove(...classes));
  };
  const clearError = (selector) => {
      const el = document.querySelector(selector);
      if (el) {
          el.style.border = "";
          const nextElem = el.nextElementSibling;
          if (nextElem && nextElem.classList.contains('error-message')) nextElem.remove();
      }
  };

  setValue("#titleInput");
  setValue("#descriptionInput");
  setValue("#date");
  const titleInput = document.querySelector("#titleInput");
  if (titleInput) titleInput.classList.remove("filled");
  clearError("#titleInput");
  clearError("#descriptionInput");
  clearError("#date");
  clearError("#assignedToDropdownContacts");
  clearError("#assignedToDropdownCategory");

  removeClasses(".prioGrade", "isClicked", "redColor", "orangeColor", "greenColor", "whitePrioFont");
  removeClasses(".prioGrade .prioImage", "filterWhite");
  selectedPrio = "";

  selectedCategory = "";
  setText("#categoryPlaceholder", "Select task category");
  removeClasses("#assignedToDropdownCategory", "selected-red");
  setStyle("#assignedToDropdownCategory", "backgroundColor", "white");
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
  const search = document.getElementById("contactSearch");
  if (search) {
    search.addEventListener("input", function () {
      const query = this.value.toLowerCase();
      const filteredContacts = allContacts.filter(name => name.toLowerCase().includes(query));
      if (window.loadedContacts) {
          renderContacts(filteredContacts, window.loadedContacts);
      }
    });
  }
  loadContacts();
});

async function loadContacts() {
  if (typeof loadContactsInAddTask === "function") {
    loadContactsInAddTask();
  }
}

window.createTask = window.createTask || createTask;
window.clearTask = window.clearTask || clearTask;
window.getSubtasksFromForm = window.getSubtasksFromForm || getSubtasksFromForm;
window.setPrioColor = window.setPrioColor || setPrioColor;

window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  if (!dateInput) return;

  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  const tryOpenPicker = () => {
    try {
      const ua = navigator.userActivation;
      const hasActivation = ua && (ua.isActive || ua.hasBeenActive);
      if (typeof dateInput.showPicker === 'function' && hasActivation) {
        dateInput.showPicker();
      }
    } catch (e) {
    }
  };

  dateInput.addEventListener('pointerdown', tryOpenPicker, { passive: true });
});

function initContactsDropdownInput() {
    const select = document.getElementById('assignedToDropdownContacts');
    const arrow = document.getElementById('dropdown-arrow-contacts');
    const dropDown = document.getElementById('dropdown-list-contacts');
    const items = dropDown.getElementsByClassName('dropdown-item-contact');

    let isOpen = false;

    select.addEventListener('click', (event) => {
        event.stopPropagation();
        isOpen = !isOpen;
        dropDown.style.display = isOpen ? 'block' : 'none';
        arrow.style.transform = isOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
    });

    document.addEventListener('click', () => {
        if (isOpen) {
            dropDown.style.display = 'none';
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
            isOpen = false;
        }
    });
    Array.from(items).forEach(item => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            isOpen = false;
            dropDown.style.display = 'none';
            arrow.style.transform = "translateY(-50%) rotate(0deg)";
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initContactsDropdownInput();
});