function __tpl_escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (m) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));
}

function __tpl_normalizePrio(prio) {
  const p = String(prio || "").toLowerCase();
  if (p.startsWith("urg")) return "urgent";
  if (p.startsWith("med")) return "medium";
  if (p.startsWith("low")) return "low";
  return "medium";
}

function __tpl_getPriorityLabel(prio) {
  const p = __tpl_normalizePrio(prio);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function __tpl_formatDate(value) {
  if (!value) return "-";
  let d;
  if (value instanceof Date) d = value;
  else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, dd] = value.split("-").map(Number);
    d = new Date(y, m - 1, dd);
  } else {
    d = new Date(value);
    if (Number.isNaN(+d)) return __tpl_escapeHtml(String(value));
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const __tpl_colors = ["#f44336","#2196F3","#FF9800","#9C27B0","#4CAF50","#00BCD4","#FFC107"];
function __tpl_bgForNameOrIndex(name, i) {
  if (typeof window !== "undefined" && typeof window.colorForName === "function") {
    return window.colorForName(name);
  }
  return __tpl_colors[i % __tpl_colors.length];
}

function __tpl_initials(name) {
  if (typeof window !== "undefined" && typeof window.initials === "function") {
    return window.initials(name);
  }
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function renderInitials(names = []) {
  const html = names
    .map((n, i) => `<div class="av" style="background:${__tpl_bgForNameOrIndex(n, i)}">${__tpl_initials(n)}</div>`)
    .join("");
  return `<div class="row"><div class="avatars">${html}</div></div>`;
}

function getPriorityIcon(prio) {
  switch ((prio || "").toLowerCase()) {
    case "urgent": return `<img src="../assets/svg/double_arrow_red.svg" alt="Urgent" class="priority-icon" />`;
    case "medium": return `<img src="../assets/svg/double_lines.svg" alt="Medium" class="priority-icon" />`;
    case "low":    return `<img src="../assets/svg/double_arrow_down.svg" alt="Low" class="priority-icon" />`;
    default:       return "";
  }
}

function getPriorityBadge(prio) {
  const p = __tpl_normalizePrio(prio);
  const label = __tpl_getPriorityLabel(p);
  let icon = "";
  switch (p) {
    case "urgent": icon = `<img src="../assets/svg/double_arrow_red.svg" alt="${label}" class="priority-icon" />`; break;
    case "medium": icon = `<img src="../assets/svg/double_lines.svg" alt="${label}" class="priority-icon" />`; break;
    case "low":    icon = `<img src="../assets/svg/double_arrow_down.svg" alt="${label}" class="priority-icon" />`; break;
  }
  return `<span class="priority"><span class="priority-text">${label}</span>${icon}</span>`;
}

function renderAvatarsWithPriority(names = [], prio) {
  const avatars = names
    .map((n, i) => `<div class="av" style="background:${__tpl_bgForNameOrIndex(n, i)}">${__tpl_initials(n)}</div>`)
    .join("");
  const prioIcon = getPriorityIcon(prio);
  return `
    <div class="row">
      <div class="avatars">${avatars}</div>
      <div class="priority-slot">${prioIcon || ""}</div>
    </div>
  `;
}

function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
    <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">
      ${__tpl_escapeHtml(t?.category || "")}
    </span>
    <div class="task-title">${__tpl_escapeHtml(t?.title || "")}</div>
    <div class="task-desc">${__tpl_escapeHtml(t?.description || "")}</div>

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
        <div class="meta">
          <span></span>
          <span></span>
        </div>
      </div>
    `
    }

    ${renderAvatarsWithPriority(t?.assignedContacts || [], t?.priority)}
  `;
}

function taskDetailTemplate(id, t = {}) {
  const title = __tpl_escapeHtml(t.title || "");
  const desc  = __tpl_escapeHtml(t.description || "");
  const cat   = __tpl_escapeHtml(t.category || "Task");
  const date  = __tpl_formatDate(t.date || "-");

  const assigned =
    (t.assignedContacts || [])
      .map((n, i) => `
      <div class="task-assigned__item">
        <div class="av" style="background:${__tpl_bgForNameOrIndex(n, i)}">${__tpl_initials(n)}</div>
        <div class="task-assigned__name">${__tpl_escapeHtml(n)}</div>
      </div>`)
      .join("") ||
    `<div class="task-assigned__item" style="opacity:.6">No assignees</div>`;

  const subtasks =
    (t.subtasks || [])
      .map((s, i) => {
        const txt  = typeof s === "string" ? s : (s?.text || "");
        const done = typeof s === "object" ? !!s?.done : false;
        const idc  = `subtask-${id}-${i}`;
        return `
        <label class="subtasks__item" for="${idc}">
          <input type="checkbox" id="${idc}" data-sub-index="${i}" ${done ? "checked" : ""}/>
          <span class="cb cb--unchecked" aria-hidden="true"></span>
          <img class="cb cb--checked" src="../assets/svg/checked.svg" alt="" aria-hidden="true" />
          <span class="txt">${__tpl_escapeHtml(txt)}</span>
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

window.renderInitials = renderInitials;
window.getPriorityIcon = getPriorityIcon;
window.getPriorityBadge = getPriorityBadge;
window.renderAvatarsWithPriority = renderAvatarsWithPriority;
window.taskCardInnerHtml = taskCardInnerHtml;
window.taskDetailTemplate = taskDetailTemplate;
