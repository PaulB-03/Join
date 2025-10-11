function editOverlayHTML() {
  return `
    <div class="overlay-panel" role="dialog" aria-modal="true">
      <div class="overlay-left">
        <img src="../assets/svg/editContactForm.svg" alt="Edit contact artwork" id="editContactImgDesktop" />
        <img src="../assets/svg/editContactFormMobile.svg" alt="Edit contact artwork" id="editContactImgMobile" />
      </div>

      <form id="editContactForm" class="overlay-body" novalidate>
        <button type="button" class="overlay-close" aria-label="Close">×</button>

        <div class="add-contact-overlay-right">
          <div id="editAvatar" class="detailsAvatar"></div>

          <div class="add-contact-overlay-form">
            <div class="field">
              <input name="name" class="has-icon icon-user input" placeholder="Name" required>
            </div>
            <div class="field">
              <input name="email" class="has-icon icon-mail input" type="email" placeholder="Email" required>
            </div>
            <div class="field">
              <input name="phone" class="has-icon icon-phone input" placeholder="Phone">
            </div>

            <div class="overlay-actions">
              <button type="button" class="btn-white" id="editDeleteBtn">Delete</button>
              <button type="submit" class="btn-dark">Save ✓</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;
}

function openEdit(contact) {
  closeEditDialog();
  const overlay = makeEditOverlay();
  mountAndShow(overlay);
  wireCloseHandlers(overlay);
  prefillEditForm(overlay, contact);
  wireLiveAvatar(overlay);
  wireDelete(overlay, contact);
  wireSave(overlay, contact);
}

// helpers for openEdit():
function makeEditOverlay() {
  const el = document.createElement("div");
  el.id = "editOverlay";
  el.className = "overlay";
  el.innerHTML = editOverlayHTML();
  return el;
}

function mountAndShow(overlay) {
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));
  document.body.classList.add("modal-open");
}

function wireCloseHandlers(overlay) {
  overlay.addEventListener("click", closeEditDialog);
  overlay
    .querySelector(".overlay-panel")
    .addEventListener("click", (e) => e.stopPropagation());
  overlay
    .querySelector(".overlay-close")
    .addEventListener("click", closeEditDialog);
}

function prefillEditForm(overlay, contact) {
  const form = overlay.querySelector("#editContactForm");
  form.elements.name.value = contact.name || "";
  form.elements.email.value = contact.email || "";
  form.elements.phone.value = contact.phone || "";
  const avatar = overlay.querySelector("#editAvatar");
  avatar.textContent = initials(contact.name);
  avatar.style.background = colorForName(contact.name);
}

function wireLiveAvatar(overlay) {
  const form = overlay.querySelector("#editContactForm");
  const avatar = overlay.querySelector("#editAvatar");
  const update = () => {
    const v = form.elements.name.value;
    avatar.textContent = initials(v);
    avatar.style.background = colorForName(v);
  };
  form.elements.name.addEventListener("input", update);
}

function wireDelete(overlay, contact) {
  overlay
    .querySelector("#editDeleteBtn")
    .addEventListener("click", async () => {
      await deleteContact(contact.id);
      closeEditDialog();
    });
}

function wireSave(overlay, contact) {
  overlay
    .querySelector("#editContactForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      const updates = {
        name: f.elements.name.value.trim(),
        email: f.elements.email.value.trim(),
        phone: f.elements.phone.value.trim(),
      };
      await updateContact(contact.id, updates);
      closeEditDialog();
    });
}

function closeEditDialog() {
  const el = document.getElementById("editOverlay");
  if (el) el.remove();
  document.body.classList.remove("modal-open");
}

function isMissingPhone(phone) {
  return (
    !(phone ?? "").trim() ||
    (phone || "").trim().toLowerCase() === "add phone number"
  );
}

function getById(id) {
  return document.getElementById(id);
}

function openFabMenu(fabContainer, toggleButton, menu) {
  fabContainer.classList.add("is-open");
  toggleButton.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
}

function closeFabMenu(fabContainer, toggleButton, menu) {
  fabContainer.classList.remove("is-open");
  toggleButton.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
}

function toggleFabMenu(fabContainer, toggleButton, menu) {
  if (fabContainer.classList.contains("is-open")) {
    closeFabMenu(fabContainer, toggleButton, menu);
  } else {
    openFabMenu(fabContainer, toggleButton, menu);
  }
}

function setupContactActionsFab(contact) {
  const fabContainer = getById("contactActionsFab");
  const toggleButton = getById("contactActionsToggle");
  const fabMenu = getById("contactActionsMenu");
  if (!fabContainer || !toggleButton || !fabMenu) return;

  getById("fabEdit").onclick = () => {
    closeFabMenu(fabContainer, toggleButton, fabMenu);
    openEdit(contact);
  };
  getById("fabDelete").onclick = () => {
    closeFabMenu(fabContainer, toggleButton, fabMenu);
    deleteContact(contact.id);
  };
  toggleButton.onclick = () =>
    toggleFabMenu(fabContainer, toggleButton, fabMenu);
  document.addEventListener("click", (e) => {
    if (!fabContainer.contains(e.target))
      closeFabMenu(fabContainer, toggleButton, fabMenu);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFabMenu(fabContainer, toggleButton, fabMenu);
  });
}
