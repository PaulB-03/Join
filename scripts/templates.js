const colors = [
  "#f44336",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#4CAF50",
  "#00BCD4",
  "#FFC107",
];

let prioGrade = "";
let selectedPrio = "";
let selectedCategory = "";
let selectedContact = "";
let selectedState = "";
let allContacts = [];
let assignedContacts = [];

function color(i) {
  return colors[i % colors.length];
}

function initials(n) {
  return (n || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

function escapeHtml(s) {
  return (s || "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

function renderInitials(names = []) {
  const html = names
    .map(
      (n, i) =>
        `<div class="av" style="background:${color(i)}">${initials(n)}</div>`
    )
    .join("");
  return `<div class="row"><div class="avatars">${html}</div></div>`;
}

function getPriorityIcon(prio) {
  switch ((prio || "").toLowerCase()) {
    case "urgent":
      return `<img src="../assets/svg/double_arrow_red.svg" alt="Urgent" class="priority-icon" />`;
    case "medium":
      return `<img src="../assets/svg/double_lines.svg" alt="Medium" class="priority-icon" />`;
    case "low":
      return `<img src="../assets/svg/double_arrow_down.svg" alt="Low" class="priority-icon" />`;
    default:
      return "";
  }
}

function normalizePrio(prio) {
  const p = String(prio || "").toLowerCase();
  if (p.startsWith("urg")) return "urgent";
  if (p.startsWith("med")) return "medium";
  if (p.startsWith("low")) return "low";
  return "medium";
}

function getPriorityLabel(prio) {
  const p = normalizePrio(prio);
  return p.charAt(0).toUpperCase() + p.slice(1); // Urgent | Medium | Low
}

function getPriorityBadge(prio) {
  const p = normalizePrio(prio);
  const label = getPriorityLabel(p);
  let icon = "";
  switch (p) {
    case "urgent":
      icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`;
      break;
    case "medium":
      icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`;
      break;
    case "low":
      icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`;
      break;
  }

  return `<span class="priority"><span class="priority-text">${label}</span>${icon}</span>`;
}
function getPriorityBadge(prio) {
  const p = normalizePrio(prio);
  const label = getPriorityLabel(p);
  let icon = "";
  switch (p) {
    case "urgent":
      icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`;
      break;
    case "medium":
      icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`;
      break;
    case "low":
      icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`;
      break;
  }
  return `<span class="priority"><span class="priority-text">${label}</span>${icon}</span>`;
}

function formatDate(value) {
  if (!value) return "-";
  let d;
  if (value instanceof Date) d = value;
  else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, dd] = value.split("-").map(Number);
    d = new Date(y, m - 1, dd);
  } else {
    d = new Date(value);
    if (Number.isNaN(+d)) return escapeHtml(String(value));
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
    <span class="pill ${t.category?.toLowerCase().includes("tech") ? "tech" : "user"}">
      ${escapeHtml(t.category || "")}
    </span>
    <div class="task-title">${escapeHtml(t.title || "")}</div>
    <div class="task-desc">${escapeHtml(t.description || "")}</div>
    ${t.assignedContacts?.length ? renderInitials(t.assignedContacts) : ""}

    ${
      total
        ? `
      <div class="progress"><div class="bar" style="width:${percent}%"></div></div>
      <div class="meta">
        <span>${doneCount}/${total} Subtasks</span>
        ${getPriorityBadge(t.priority)}
      </div>
    `
        : `
      <div class="meta">
        <span></span>
        ${getPriorityBadge(t.priority)}
      </div>
    `
    }
  `;
}

function taskDetailTemplate(id, t = {}) {
  const title = escapeHtml(t.title || "");
  const desc = escapeHtml(t.description || "");
  const cat = escapeHtml(t.category || "Task");
  const date = formatDate(t.date || "-");

  const assigned =
    (t.assignedContacts || [])
      .map(
        (n, i) => `
      <div class="task-assigned__item">
        <div class="av" style="background:${color(i)}">${initials(n)}</div>
        <div class="task-assigned__name">${escapeHtml(n)}</div>
      </div>`
      )
      .join("") ||
    `<div class="task-assigned__item" style="opacity:.6">No assignees</div>`;

  const subtasks =
    (t.subtasks || [])
      .map((s, i) => {
        const txt = typeof s === "string" ? s : s?.text || "";
        const done = typeof s === "object" ? !!s?.done : false;
        const idc = `subtask-${id}-${i}`;
        return `
        <label class="subtasks__item" for="${idc}">
          <input type="checkbox" id="${idc}" data-sub-index="${i}" ${done ? "checked" : ""}/>
          <span class="cb cb--unchecked" aria-hidden="true"></span>
          <img class="cb cb--checked" src="../assets/svg/checked.svg" alt="" aria-hidden="true" />
          <span class="txt">${escapeHtml(txt)}</span>
        </label>`;
      })
      .join("") ||
    `<div class="subtasks__item" style="opacity:.6">No subtasks</div>`;

  return `
    <div class="task-detail" data-id="${id}">
      <span class="pill">${cat}</span>
      <h2 id="taskDetailTitle" class="task-detail__title">${title.replace(/\n/g, "<br>")}</h2>

      ${desc ? `<p class="task-detail__desc">${desc}</p>` : ""}

      <dl class="task-meta">
        <dt>Due date</dt><dd>${date}</dd>
        <dt>Priority</dt><dd>${getPriorityBadge(t.priority)}</dd>
      </dl>

      <div class="task-assigned">
        <div class="section-title" style="font-weight:700;margin-bottom:6px;color:#6b7280">Assigned to:</div>
        <div class="task-assigned__list task-name">${assigned}</div>
      </div>

      <div class="subtasks">
        <div class="section-title" style="font-weight:700;margin:14px 0 6px;color:#6b7280">Subtasks</div>
        <div class="subtasks__list task-name">${subtasks}</div>
      </div>
      <div class="task-actions">
      <button type="button" id="taskDelete" class="danger">
        <img class="icon" src="../../assets/svg/delete.svg" alt="Delete" />
        <span>Delete</span>
      </button>
      <div class="task-divider"></div>
      <button type="button" id="taskEdit" class="primary">
        <img class="icon" src="../../assets/svg/edit_black.svg" alt="Edit" />
        <span>Edit</span>
      </button>
    </div>
    </div>
    
  `;
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
            if (nextElem && nextElem.classList.contains('error-message')) {
                nextElem.remove();
            }
        });

        const prioElem = document.getElementById('priorityInput');
        if (prioElem) {
            prioElem.style.border = '';
            const nextElem = prioElem.nextElementSibling;
            if (nextElem && nextElem.classList.contains('error-message')) {
                nextElem.remove();
            }
        }
        const categoryElem = document.getElementById('categoryInput');
        if (categoryElem) {
            categoryElem.style.border = '';
            const nextElem = categoryElem.nextElementSibling;
            if (nextElem && nextElem.classList.contains('error-message')) {
                nextElem.remove();
            }
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
    if (!title.value.trim()) {
        showError(title);
        isValid = false;
    }
    if (!description.value.trim()) {
        showError(description);
        isValid = false;
    }
    if (!date.value.trim()) {
        showError(date);
        isValid = false;
    }
    if (!document.getElementById('assignedToInitials')) {
    const contactElem = document.getElementById('assignedToDropdownContacts');
    if (contactElem) {
        showError(contactElem);
    }
    isValid = false;
    }
    if (!selectedCategory) {
        const categoryElem = document.getElementById('assignedToDropdownCategory');
        if (categoryElem) {
            showError(categoryElem);
        }
        isValid = false;
    }
    if (!isValid) {
        return;
    }
    try {
        let tasks = await getTasks();
        if (tasks) {
            const existingIndices = Object.keys(tasks)
                .map(key => parseInt(key))
                .filter(key => !isNaN(key));
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
}

async function saveTask(path = "", data = {}) {
    let response = await fetch(baseURL + path + ".json", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
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
    const clearError = (selector) => {
        const el = document.querySelector(selector);
        if (el) {
            el.style.border = "";
            const nextElem = el.nextElementSibling;
            if (nextElem && nextElem.classList.contains('error-message')) {
                nextElem.remove();
            }
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