document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".input-subtask");
  const controls = document.querySelector(".subtask-images-container");
  const wrapper = document.querySelector(".addedSubtaskWrapper");
  const cancelBtn = document.querySelector(".cancelSubtask");
  const saveBtn = document.querySelector(".saveSubtask");

  const toggleControls = () => controls.style.display = input.value.trim() ? "flex" : "none";

  input.addEventListener("input", toggleControls);
  cancelBtn.addEventListener("click", () => { input.value = ""; toggleControls(); });

  saveBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;

    const item = document.createElement("div");
    item.className = "subtaskItem";
    item.innerHTML = `
      <span class="subtaskTitle">${text}</span>
      <div class="subtaskActions">
        <img src="../assets/svg/edit_black.svg" alt="Edit" class="editIcon">
        <img src="../assets/svg/delete.svg" alt="Delete" class="deleteIcon">
      </div>
    `;

    wrapper.appendChild(item);
    input.value = "";
    toggleControls();

    const title = item.querySelector(".subtaskTitle");
    const actions = item.querySelector(".subtaskActions");
    const del = item.querySelector(".deleteIcon");
    const edit = item.querySelector(".editIcon");

    del.addEventListener("click", () => item.remove());

    edit.addEventListener("click", () => {
      title.style.display = "none";

      const editInput = document.createElement("input");
      editInput.value = title.textContent;
      editInput.className = "editInput";

      const editActions = document.createElement("div");
      editActions.className = "subtaskActions";
      editActions.innerHTML = `
        <img src="../assets/svg/check_2_black.svg" alt="Save" class="saveEdit">
        <img src="../assets/svg/cancel.svg" alt="Cancel" class="cancelEdit">
      `;

      item.insertBefore(editInput, actions);
      item.replaceChild(editActions, actions);

      const exitEdit = (save) => {
        if (save && editInput.value.trim()) title.textContent = editInput.value.trim();
        title.style.display = "inline";
        item.removeChild(editInput);
        item.replaceChild(actions, editActions);
      };

      editActions.querySelector(".saveEdit").addEventListener("click", () => exitEdit(true));
      editActions.querySelector(".cancelEdit").addEventListener("click", () => exitEdit(false));
    });
  });
});