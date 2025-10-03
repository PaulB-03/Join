function taskCardInnerHtml(t, percent, doneCount, total) {
  return `
    <span class="pill ${t?.category?.toLowerCase?.().includes("tech") ? "tech" : "user"}">
      ${escapeHtml(t?.category || "")}
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

function taskDetailTemplate(id, t = {}) {
  const title = escapeHtml(t.title || "");
  const desc  = escapeHtml(t.description || "");
  const cat   = escapeHtml(t.category || "Task");
  const date  = formatDate(t.date || "-");

  const assigned =
    (t.assignedContacts || [])
      .map((n, i) => `
      <div class="task-assigned__item">
        <div class="av" style="background:${bgForNameOrIndex(n, i)}">${initials(n)}</div>
        <div class="task-assigned__name">${escapeHtml(n)}</div>
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
        <div class="section-title">Assigned to:</div>
        <div class="task-assigned__list task-name">${assigned}</div>
      </div>

      <div class="subtasks">
        <div class="section-title">Subtasks</div>
        <div class="subtasks__list task-name">${subtasks}</div>
      </div>

      <div class="task-actions">
        <button type="button" id="taskDelete" class="danger">🗑 Delete</button>
        <div class="task-divider"></div>
        <button type="button" id="taskEdit" class="primary">✏ Edit</button>
      </div>
    </div>
  `;
}
