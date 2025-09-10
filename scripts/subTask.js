document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".input-subtask");
  const controls = document.querySelector(".subtask-images-container");
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  const cancelBtn = document.querySelector(".cancelSubtask");
  const saveBtn = document.querySelector(".saveSubtask");

  const toggleControls = () => {
    if (document.activeElement === input || input.value.trim()) {
      controls.style.display = "flex";
    } else {
      controls.style.display = "none";
    }
  };

  input.addEventListener("focus", toggleControls);
  input.addEventListener("input", toggleControls);
  input.addEventListener("blur", () => {
    if (!input.value.trim()) controls.style.display = "none";
  });

  cancelBtn.addEventListener("click", () => {
    input.value = "";
    toggleControls();
    input.focus();
  });

  saveBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;

    const item = document.createElement("div");
    item.className = "subtaskItem";
    item.innerHTML = `
      <span class="subtaskTitle">• ${text}</span>
      <div class="subtaskActions">
        <img src="../assets/svg/subedit.svg" alt="Edit" class="editIcon">
        <div class="divider1"></div>
        <img src="../assets/svg/subdelete.svg" alt="Delete" class="deleteIcon">
      </div>
    `;

    wrapper.appendChild(item);
    input.value = "";
    toggleControls();

    const title = item.querySelector(".subtaskTitle");
    const actions = item.querySelector(".subtaskActions");
    const del = item.querySelector(".deleteIcon");
    const edit = item.querySelector(".editIcon");

    const enterEditMode = () => {
      item.style.backgroundColor = "#fff"; // highlight edit mode
      title.style.display = "none";

      const editInput = document.createElement("input");
      editInput.value = title.textContent.replace(/^•\s/, "");
      editInput.className = "editInput";

      // Swap icons: Delete | Save
      const editActions = document.createElement("div");
      editActions.className = "subtaskActions";
      editActions.innerHTML = `
        <img src="../assets/svg/subdelete.svg" alt="Cancel" class="cancelEdit">
        <div class="divider1"></div>
        <img src="../assets/svg/subcheck.svg" alt="Save" class="saveEdit">
      `;

      item.insertBefore(editInput, actions);
      item.replaceChild(editActions, actions);

      const exitEdit = (save) => {
        if (save && editInput.value.trim()) {
          title.textContent = `• ${editInput.value.trim()}`;
        }
        title.style.display = "inline";
        item.style.backgroundColor = ""; // restore background
        item.removeChild(editInput);
        item.replaceChild(actions, editActions);
      };

      editActions.querySelector(".saveEdit").addEventListener("click", () => exitEdit(true));
      editActions.querySelector(".cancelEdit").addEventListener("click", () => exitEdit(false));

      editInput.focus();
    };

    // Click on title or edit icon enters edit mode
    title.addEventListener("click", enterEditMode);
    edit.addEventListener("click", enterEditMode);

    // Delete subtask in normal mode
    del.addEventListener("click", () => item.remove());
  });
});