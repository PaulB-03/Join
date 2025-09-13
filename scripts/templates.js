const colors = [
  "#f44336",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#4CAF50",
  "#00BCD4",
  "#FFC107",
];

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

function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
    <span class="pill ${
      t.category?.toLowerCase().includes("tech") ? "tech" : "user"
    }">${t.category || ""}</span>
    <div class="task-title">${escapeHtml(t.title || "")}</div>
    <div class="task-desc">${escapeHtml(t.description || "")}</div>
    ${t.assignedContacts?.length ? renderInitials(t.assignedContacts) : ""}

    ${
      total
        ? `
      <div class="progress"><div class="bar" style="width:${percent}%"></div></div>
      <div class="meta">
        <span>${doneCount}/${total} Subtasks</span>
        ${getPriorityIcon(t.priority)}
      </div>
    `
        : `
      <div class="meta">
        <span></span>
        ${getPriorityIcon(t.priority)}
      </div>
    `
    }
  `;
}

function taskDetailTemplate(id, t = {}) {
  const title = escapeHtml(t.title || "");
  const desc = escapeHtml(t.description || "");
  const cat = escapeHtml(t.category || "Task");
  const date = escapeHtml(t.date || "-");
  const prio = (t.priority || "medium").toLowerCase();

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
          <input type="checkbox" id="${idc}" data-sub-index="${i}" ${
          done ? "checked" : ""
        }/>
          <span>${escapeHtml(txt)}</span>
        </label>`;
      })
      .join("") ||
    `<div class="subtasks__item" style="opacity:.6">No subtasks</div>`;

  return `
    <div class="task-detail" data-id="${id}">
      <span class="pill">${cat}</span>
      <h2 id="taskDetailTitle" class="task-detail__title">${title.replace(
        /\n/g,
        "<br>"
      )}</h2>

      ${desc ? `<p class="task-detail__desc">${desc}</p>` : ""}

      <dl class="task-meta">
        <dt>Due date</dt><dd>${date}</dd>
        <dt>Priority</dt>
        <dd>${getPriorityIcon(prio)}</dd>
      </dl>

      <div class="task-assigned">
        <div class="section-title" style="font-weight:700;margin-bottom:6px;color:#6b7280">Assigned to:</div>
        <div class="task-assigned__list">${assigned}</div>
      </div>

      <div class="subtasks">
        <div class="section-title" style="font-weight:700;margin:14px 0 6px;color:#6b7280">Subtasks</div>
        <div class="subtasks__list">${subtasks}</div>
      </div>
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
  `;
}
