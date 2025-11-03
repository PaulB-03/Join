/**
 * Regex for validating a full name (two or more parts).
 * @constant {RegExp}
 */
const addNameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+)+$/;

/**
 * Regex for validating an email address.
 * @constant {RegExp}
 */
const addEmailRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß]+(?:\.[a-zA-ZÀ-ÖØ-öø-ÿß]+)?@[a-zA-ZÀ-ÖØ-öø-ÿß]+\.[a-zA-ZÀ-ÖØ-öø-ÿß]+$/;

/**
 * Regex for validating a phone number (optional).
 * @constant {RegExp}
 */
const addPhoneRegex = /^\s*$|^\+?[0-9\-\*\s]+$/;

/**
 * Update the error UI state for a field.
 * @param {boolean} isValid
 * @param {HTMLInputElement} inputEl
 * @param {HTMLElement} errorEl
 * @returns {void}
 */
function updateFieldErr(isValid, inputEl, errorEl) {
  if (!inputEl || !errorEl) return;
  errorEl.style.visibility = isValid ? "hidden" : "visible";
  inputEl.classList.toggle("input-error", !isValid);
  inputEl.setAttribute("aria-invalid", String(!isValid));
}

/**
 * Get references to Add Contact form fields and error nodes.
 * @returns {AddContactRefs}
 */
function getAddContactRefs() {
  const form = document.getElementById("addContactForm");
  if (!form) return {};
  return {
    form,
    name: document.getElementById("contactName") || form.querySelector('[name="name"]'),
    email: document.getElementById("contactEmail") || form.querySelector('[name="email"]'),
    phone: document.getElementById("contactPhone") || form.querySelector('[name="phone"]'),
    nameErr: document.getElementById("contactNameError"),
    emailErr: document.getElementById("contactEmailError"),
    phoneErr: document.getElementById("contactPhoneError"),
  };
}

/**
 * Get references to Edit Contact form fields and their associated error nodes.
 * @param {HTMLElement} root - The overlay root element containing the edit form.
 * @returns {object} References to form, input fields, and error elements.
 */
function getEditRefs(root) {
  const form = root.querySelector("#editContactForm");
  return {
    form,
    name: form?.elements?.name,
    email: form?.elements?.email,
    phone: form?.elements?.phone,
    nameErr: root.querySelector('[data-edit-error="name"]'),
    emailErr: root.querySelector('[data-edit-error="email"]'),
    phoneErr: root.querySelector('[data-edit-error="phone"]'),
  };
}

/**
 * Validate the Edit Contact form values. Ensures name and email are non-empty and match allowed patterns; phone must be empty or match allowed characters.
 * @param {HTMLElement} root - The overlay element containing the form.
 * @returns {boolean} True if all fields are valid.
 */
function validateEditContactForm(root) {
  const { name, email, phone, nameErr, emailErr, phoneErr } = getEditRefs(root);
  if (!name || !email || !phone) return false;
  const n = name.value.trim();
  const e = email.value.trim();
  const p = (phone.value || "").trim();
  const nameOk = !!n && addNameRegex.test(n);
  const emailOk = !!e && addEmailRegex.test(e);
  const phoneOk = addPhoneRegex.test(p);
  updateFieldErr(nameOk, name, nameErr);
  updateFieldErr(emailOk, email, emailErr);
  updateFieldErr(phoneOk, phone, phoneErr);
  return nameOk && emailOk && phoneOk;
}

/**
 * Validate the Add Contact form values.
 * @returns {boolean} True if all fields are valid.
 */
function validateAddContactForm() {
  const { name, email, phone, nameErr, emailErr, phoneErr } = getAddContactRefs();
  if (!name || !email || !phone) return false;
  const n = name.value.trim(),
    e = email.value.trim(),
    p = (phone.value || "").trim();
  const validName = addNameRegex.test(n);
  const validEmail = addEmailRegex.test(e);
  const validPhone = addPhoneRegex.test(p);
  updateFieldErr(validName, name, nameErr);
  updateFieldErr(validEmail, email, emailErr);
  updateFieldErr(validPhone, phone, phoneErr);
  return validName && validEmail && validPhone;
}


/**
 * Resets the UI validation state for the Add Contact form. Removes validation error styles, accessibility attributes, and hides displayed error messages for name, email, and phone inputs.
 * @returns {void}
 */
function resetAddContactValidationUI() {
  const { name, email, phone, nameErr, emailErr, phoneErr } = getAddContactRefs();
  [
    [name, nameErr],
    [email, emailErr],
    [phone, phoneErr],
  ].forEach(([input, err]) => {
    if (!input || !err) return;
    input.classList.remove("input-error");
    input.removeAttribute("aria-invalid");
    err.style.visibility = "hidden";
  });
}


/**
 * Delete a contact by id and update the UI.
 * @async
 * @param {string} id - Firebase id of the contact to delete.
 * @returns {Promise<void>}
 */
async function deleteContact(id) {
  if (!id) return;
  const contact = contacts.find((c) => c.id === id);
  if (contact) await removeContactFromAllTasks(contact.name);
  const res = await fetch(`${DB_ROOT}/contacts/${id}.json`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contact");
  await loadContacts();
  const body = document.querySelector(".contactDetailsBody");
  body.classList.add("d_none");
  if (body) body.innerHTML = "";
  document.body.classList.remove("showing-details");
  backToList();
}

/**
 * Remove a contact's name from all tasks where it is assigned.
 * @async
 * @param {string} name - Contact's display name used in tasks.
 * @returns {Promise<void>}
 */
async function removeContactFromAllTasks(name) {
  try {
    const res = await fetch(`${DB_ROOT}/tasks.json`);
    const tasks = (await res.json()) || {};
    await Promise.all(
      Object.entries(tasks)
        .filter(([_, t]) => t.assignedContacts?.includes(name))
        .map(([id, t]) =>
          fetch(`${DB_ROOT}/tasks/${id}.json`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedContacts: t.assignedContacts.filter((n) => n !== name) }),
          })
        )
    );
  } catch (e) {
    console.error("Failed to remove contact from tasks:", e);
  }
}

/**
 * Remove the `id` property from an object.
 * @template T extends object
 * @param {T} obj - Source object.
 * @returns {Omit<T, "id">} Copy without `id`.
 */
function stripId(obj) {
  const { id, ...rest } = obj || {};
  return rest;
}

/**
 * Update a contact by id with partial fields.
 * @async
 * @param {string} id - Firebase id of the contact to update.
 * @param {Partial<Contact>} updates - Fields to overwrite.
 * @returns {Promise<void>}
 */
async function updateContact(id, updates) {
  const existing = contacts.find((c) => c.id === id) || {};
  const payload = stripId({ ...existing, ...updates });
  const res = await fetch(`${DB_ROOT}/contacts/${id}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update contact");
  await loadContacts();
  const updated = contacts.find((c) => c.id === id);
  if (updated) renderContactDetails(updated);
}

/**
 * Wires live validation for the Edit Contact form. Runs validation on input and blur events and initializes error states.
 * @param {HTMLElement} overlay - The overlay element containing the form.
 * @returns {void}
 */
function wireEditValidationLive(overlay) {
  const f = overlay.querySelector("#editContactForm");
  const run = () => validateEditContactForm(overlay);
  ["input", "blur"].forEach((evt) => ["name", "email", "phone"].forEach((k) => f.elements[k]?.addEventListener(evt, run)));
  run();
}

/**
 * Opens the edit overlay for a given contact and wires all interactions.
 * @param {Contact} contact - The contact to edit.
 * @see deleteContact
 * @see updateContact
 * @see initials
 * @see colorForName
 */
function openEdit(contact) {
  closeEditDialog();
  const overlay = makeEditOverlay();
  mountAndShow(overlay);
  wireCloseHandlers(overlay);
  prefillEditForm(overlay, contact);
  wireEditValidationLive(overlay);
  wireLiveAvatar(overlay);
  wireDelete(overlay, contact);
  wireSave(overlay, contact);
}

/**
 * Creates the overlay container element for the edit dialog.
 * @returns {HTMLElement} The overlay root element.
 */
function makeEditOverlay() {
  const el = document.createElement("div");
  el.id = "editOverlay";
  el.className = "overlay";
  el.innerHTML = editOverlayHTML();
  return el;
}

/**
 * Appends the overlay to the DOM and displays it.
 * @param {HTMLElement} overlay - The overlay element to mount.
 * @returns {void}
 */
function mountAndShow(overlay) {
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));
  document.body.classList.add("modal-open");
}

/**
 * Registers handlers to close the overlay via outside click or close button.
 * @param {HTMLElement} overlay - The overlay element to wire.
 * @returns {void}
 */
function wireCloseHandlers(overlay) {
  overlay.addEventListener("click", closeEditDialog);
  overlay.querySelector(".overlay-panel").addEventListener("click", (e) => e.stopPropagation());
  overlay.querySelector(".overlay-close").addEventListener("click", closeEditDialog);
}

/**
 * Prefills the edit form fields and avatar based on the provided contact.
 * @param {HTMLElement} overlay - The overlay element containing the form.
 * @param {Contact} contact - The contact whose data is used to prefill the form.
 * @returns {void}
 */
function prefillEditForm(overlay, contact) {
  const form = overlay.querySelector("#editContactForm");
  form.elements.name.value = contact.name || "";
  form.elements.email.value = contact.email || "";
  form.elements.phone.value = contact.phone || "";
  const avatars = overlay.querySelectorAll("#editAvatar, #editAvatar2");
  avatars.forEach((avatar) => {
    avatar.textContent = initials(contact.name);
    avatar.style.background = colorForName(contact.name);
  });
}

/**
 * Updates the avatar (initials and background color) live as the name input changes.
 * @param {HTMLElement} overlay - The overlay element containing the form and avatar.
 * @returns {void}
 */
function wireLiveAvatar(overlay) {
  const form = overlay.querySelector("#editContactForm");
  const avatars = overlay.querySelectorAll("#editAvatar, #editAvatar2");
  const update = () => {
    const v = form.elements.name.value;
    avatars.forEach((avatar) => {
      avatar.textContent = initials(v);
      avatar.style.background = colorForName(v);
    });
  };
  form.elements.name.addEventListener("input", update);
}

/**
 * Wires the delete button inside the overlay to remove the contact.
 * @param {HTMLElement} overlay - The overlay element containing the delete button.
 * @param {Contact} contact - The contact to delete.
 * @returns {void}
 * @see deleteContact
 */
function wireDelete(overlay, contact) {
  overlay.querySelector("#editDeleteBtn").addEventListener("click", async () => {
    await deleteContact(contact.id);
    closeEditDialog();
  });
}

/**
 * Handles the form submission for saving updates to a contact.
 * @param {HTMLElement} overlay - The overlay element containing the form.
 * @param {Contact} contact - The contact being updated.
 * @returns {void}
 * @see updateContact
 */
function wireSave(overlay, contact) {
  overlay.querySelector("#editContactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateEditContactForm(overlay)) return; // <-- shows errors
    const f = e.currentTarget,
      n = f.elements.name.value.trim(),
      em = f.elements.email.value.trim(),
      ph = (f.elements.phone.value || "").replace(/[^0-9+\-\*\s]/g, "").trim();
    await updateContact(contact.id, { name: n, email: em, phone: ph });
    closeEditDialog();
  });
}

/**
 * Closes and removes the edit overlay, restoring page scroll.
 * @returns {void}
 */
function closeEditDialog() {
  const el = document.getElementById("editOverlay");
  if (el) el.remove();
  document.body.classList.remove("modal-open");
}

/**
 * Checks whether a phone value is empty or a placeholder.
 * @param {string} [phone] - The phone value to check.
 * @returns {boolean} True if the phone is missing or equals the placeholder text; otherwise false.
 */
function isMissingPhone(phone) {
  return !(phone ?? "").trim() || (phone || "").trim().toLowerCase() === "add phone number";
}

/**
 * Convenience wrapper for document.getElementById.
 * @param {string} id - Element ID.
 * @returns {HTMLElement|null} The found element or null.
 */
function getById(id) {
  return document.getElementById(id);
}

/**
 * Opens the Floating Action Button (FAB) action menu.
 * Updates ARIA attributes for accessibility.
 * @param {HTMLElement} fabContainer - The FAB container element.
 * @param {HTMLElement} toggleButton - The button that toggles the menu.
 * @param {HTMLElement} menu - The menu element containing the actions.
 * @returns {void}
 */
function openFabMenu(fabContainer, toggleButton, menu) {
  fabContainer.classList.add("is-open");
  toggleButton.setAttribute("aria-expanded", "true");
  menu.setAttribute("aria-hidden", "false");
}

/**
 * Closes the Floating Action Button (FAB) action menu.
 * Updates ARIA attributes for accessibility.
 * @param {HTMLElement} fabContainer - The FAB container element.
 * @param {HTMLElement} toggleButton - The button that toggles the menu.
 * @param {HTMLElement} menu - The menu element containing the actions.
 * @returns {void}
 */
function closeFabMenu(fabContainer, toggleButton, menu) {
  fabContainer.classList.remove("is-open");
  toggleButton.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-hidden", "true");
}

/**
 * Toggles the open/closed state of the FAB action menu.
 * @param {HTMLElement} fabContainer - The FAB container element.
 * @param {HTMLElement} toggleButton - The button that toggles the menu.
 * @param {HTMLElement} menu - The menu element containing the actions.
 * @returns {void}
 */
function toggleFabMenu(fabContainer, toggleButton, menu) {
  if (fabContainer.classList.contains("is-open")) {
    closeFabMenu(fabContainer, toggleButton, menu);
  } else {
    openFabMenu(fabContainer, toggleButton, menu);
  }
}

/**
 * Initializes FAB actions for a given contact:
 * - Edit opens the edit overlay.
 * - Delete removes the contact.
 * - Outside click and Escape key close the menu.
 * @param {Contact} contact - The contact linked to the FAB actions.
 * @returns {void}
 * @see openEdit
 * @see deleteContact
 */
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
  toggleButton.onclick = () => toggleFabMenu(fabContainer, toggleButton, fabMenu);
  document.addEventListener("click", (e) => {
    if (!fabContainer.contains(e.target)) closeFabMenu(fabContainer, toggleButton, fabMenu);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFabMenu(fabContainer, toggleButton, fabMenu);
  });
}
