/**
 * Generates an HTML template for a row displaying user avatars and a priority icon.
 *
 * @param {string} avatars - The HTML string containing avatar elements (usually generated from user initials and colors).
 * @param {string} more - The HTML string representing the “+N” avatar element for extra users not shown.
 * @param {string} prioIcon - The HTML string for the priority icon, or an empty string if none.
 * @returns {string} HTML string representing the avatar row with the priority icon.
 */
function avatarRowTemplate(avatars, more, prioIcon) {
  return `
    <div class="row">
      <div class="avatars">${avatars}${more}</div>
      <div class="priority-slot">${prioIcon || ""}</div>
    </div>
  `;
}

/**
 * Builds the HTML for a task card (board view).
 * Includes category pill, description, subtask progress, and avatars.
 * @param {Object} t - Task object.
 * @param {number} percent - Percent completed of subtasks.
 * @param {number} doneCount - Completed subtasks count.
 * @param {number} total - Total subtasks count.
 * @returns {string} HTML markup for task card.
 */
function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
  <img onclick="swapState(event)" class="swapHoriz" src="../assets/svg/swap_horiz.svg" alt="Pfeil nach Oben und Nach unten">
    <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">
      ${escapeHtml(t?.category)}
    </span>
    <div class="task-title">${escapeHtml(t?.title || "")}</div>
    <div class="task-desc">${escapeHtml(t?.description || "")}</div>
    ${
      total
        ? `
      <div class="meta-container">
        <div class="progress">
          <div class="bar" style="width:${percent}%"></div>
        </div>
        <div class="meta">
          <span>${doneCount}/${total} Subtasks</span>
          <span></span>
        </div>
      </div>
    `
        : `
      <div class="meta-container">
        <div class="meta"><span></span><span></span></div>
      </div>
    `
    }
    ${renderAvatarsWithPriority(t?.assignedContacts || [], t?.priority)}
  `;
}

/**
 * Returns HTML for the “Move To” swap menu template.
 * Used in the task card swap (state change) overlay.
 * @returns {string} HTML markup for the swap menu.
 */
function getSwapTemplate() {
  return `
         <ul class="swapMenu" id="swapMenu">
            <li class="swapMenuHeading">Move To</li>
            <div class="menuStates">
              <li>To-do</li>
              <li>In Progress</li>
              <li>Await Feedback</li>
              <li>Done</li>
            </div>
          </ul>
  `;
}

/**
 * Generates the HTML for a single assigned task item.
 *
 * @param {string} n - The name of the person assigned to the task.
 * @returns {string} HTML string representing the assigned person item.
 */
function taskAssignedItemTemplate(n) {
  return `
      <div class="task-assigned__item">
        <div class="av" style="background-color:${colorForName(n)}">${initials(n)}</div>
        <h6 class="task-assigned__name">${escapeHtml(n)}</h6>
      </div>`;
}

/**
 * Generates HTML for a single subtask element including edit and delete actions.
 *
 * @param {string} text - The text/title of the subtask.
 * @returns {string} HTML string representing the subtask with action icons.
 */
function createSubtaskElementTemplate(text) {
  return `
    <span class="subtaskTitle">${escapeHtml(text)}</span>
    <div class="subtaskActions">
      <img src="../assets/svg/subedit.svg" alt="Edit" class="editIcon">
      <div class="divider1"></div>
      <img src="../assets/svg/subdelete.svg" alt="Delete" class="deleteIcon">
    </div>`;
}

/**
 * Generates HTML for a subtask list item with a checkbox.
 *
 * @param {string} idc - The unique ID for the checkbox input element.
 * @param {number} i - The index of the subtask in the list.
 * @param {boolean} done - Whether the subtask is marked as completed.
 * @param {string} txt - The subtask text/content.
 * @returns {string} HTML string representing a subtask item with checkbox.
 */
function subtasksItemTemplate(idc, i, done, txt) {
  return `
        <label class="subtasks__item" for="${idc}">
          <input type="checkbox" id="${idc}" data-sub-index="${i}" ${done ? "checked" : ""}/>
          <div class="cb cb--unchecked" aria-hidden="true"></div>
          <div class="cb cb--checked" aria-hidden="true"></div>
          <span class="txt">${escapeHtml(txt)}</span>
        </label>`;
}

/**
 * Generates the detailed HTML view of a task, including title, description, metadata,
 * assigned users, subtasks, and action buttons.
 *
 * @param {string|number} id - The unique identifier for the task.
 * @param {Object} t - The full task object.
 * @param {string} cat - The task category name.
 * @param {string} title - The title of the task.
 * @param {string} desc - Optional description of the task.
 * @param {string} date - The due date for the task.
 * @param {string} assigned - HTML string of assigned users (rendered using `taskAssignedItemTemplate`).
 * @param {string} subtasks - HTML string of subtasks (rendered using `subtasksItemTemplate` or `createSubtaskElementTemplate`).
 * @returns {string} HTML string representing the detailed task view.
 */
function taskDetailTemplate(id, t, cat, title, desc, date, assigned, subtasks) {
  return `
    <div class="task-detail" data-id="${id}">
      <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">${cat}</span>
      <h1 id="taskDetailTitle" class="task-detail__title">${title.replace(/\n/g, "<br>")}</h1>
      ${desc ? `<h6 class="task-detail__desc">${desc}</h6>` : ""}
      <dl class="task-meta">
        <dt><h6>Due date:</h6></dt><dd><h6>${date}</h6></dd>
        <dt><h6>Priority:</h6></dt><dd>${getPriorityBadge(t.priority)}</dd>
      </dl>
      <div class="task-assigned">
        <h6 class="section-title">Assigned to:</h6>
        <div class="task-assigned__list task-name">${assigned}</div>
      </div>
      <div class="subtasks">
        <div class="section-title"><h6>Subtasks</h6></div>
        <div class="subtasks__list">${subtasks}</div>
      </div>
      <div class="task-actions">
        <button type="button" id="taskDelete" class="danger">
          <img class="icon" src="../assets/svg/subdelete.svg" alt="" aria-hidden="true" />
          <span>Delete</span>
        </button>
        <div class="task-divider"></div>
        <button type="button" id="taskEdit" class="primary">
          <img class="icon" src="../assets/svg/subedit.svg" alt="" aria-hidden="true" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  `;
}
