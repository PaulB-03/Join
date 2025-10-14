/**
 * Regex for validating a full name (two or more parts).
 * @constant {RegExp}
 */
const addNameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+)+$/;

/**
 * Regex for validating an email address.
 * @constant {RegExp}
 */
const addEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regex for validating a phone number (optional).
 * @constant {RegExp}
 */
const addPhoneRegex = /^\s*$|^\+?[0-9\s\-()]{6,}$/;

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
    name:
      document.getElementById("contactName") ||
      form.querySelector('[name="name"]'),
    email:
      document.getElementById("contactEmail") ||
      form.querySelector('[name="email"]'),
    phone:
      document.getElementById("contactPhone") ||
      form.querySelector('[name="phone"]'),
    nameErr: document.getElementById("contactNameError"),
    emailErr: document.getElementById("contactEmailError"),
    phoneErr: document.getElementById("contactPhoneError"),
  };
}


/**
 * Validate the Add Contact form values.
 * @returns {boolean} True if all fields are valid.
 */
function validateAddContactForm() {
  const { name, email, phone, nameErr, emailErr, phoneErr } = getAddContactRefs(); 
  if (!name || !email || !phone) return false; 
  const validName = addNameRegex.test(name.value.trim()); 
  const validEmail = addEmailRegex.test(email.value.trim());
  const validPhone = addPhoneRegex.test((phone.value || "").trim());
  updateFieldErr(validName, name, nameErr); 
  updateFieldErr(validEmail, email, emailErr);
  updateFieldErr(validPhone, phone, phoneErr);
  return validName && validEmail && validPhone;
}


/**
 * Delete a contact by id and update the UI.
 * @async
 * @param {string} id - Firebase id of the contact to delete.
 * @returns {Promise<void>}
 */
async function deleteContact(id) {
  if (!id) return; 
  const contact = contacts.find(c => c.id === id); 
  if (contact) await removeContactFromAllTasks(contact.name);  
  const res = await fetch(`${DB_ROOT}/contacts/${id}.json`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contact"); 
  await loadContacts(); 
  const body = document.querySelector(".contactDetailsBody"); 
  if (body) body.innerHTML = "";
  document.body.classList.remove("showing-details");
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
    await Promise.all(Object.entries(tasks) 
      .filter(([_, t]) => t.assignedContacts?.includes(name)) 
      .map(([id, t]) => fetch(`${DB_ROOT}/tasks/${id}.json`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedContacts: t.assignedContacts.filter(n => n !== name) }) 
      })));
  } catch (e) { console.error("Failed to remove contact from tasks:", e); } 
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
  overlay
    .querySelector(".overlay-panel")
    .addEventListener("click", (e) => e.stopPropagation()); 
  overlay
    .querySelector(".overlay-close")
    .addEventListener("click", closeEditDialog); 
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
  const avatar = overlay.querySelector("#editAvatar"); 
  avatar.textContent = initials(contact.name);
  avatar.style.background = colorForName(contact.name);
}


/**
 * Updates the avatar (initials and background color) live as the name input changes.
 * @param {HTMLElement} overlay - The overlay element containing the form and avatar.
 * @returns {void}
 */
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


/**
 * Wires the delete button inside the overlay to remove the contact.
 * @param {HTMLElement} overlay - The overlay element containing the delete button.
 * @param {Contact} contact - The contact to delete.
 * @returns {void}
 * @see deleteContact
 */
function wireDelete(overlay, contact) {
  overlay
    .querySelector("#editDeleteBtn")
    .addEventListener("click", async () => {
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
  overlay
    .querySelector("#editContactForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault(); 
      const f = e.currentTarget; 
      const updates = {name: f.elements.name.value.trim(), email: f.elements.email.value.trim(), phone: f.elements.phone.value.trim()};
      await updateContact(contact.id, updates);
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
  return (
    !(phone ?? "").trim() ||
    (phone || "").trim().toLowerCase() === "add phone number" 
  );
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
  getById("fabEdit").onclick = () => { closeFabMenu(fabContainer, toggleButton, fabMenu); openEdit(contact); }; 
  getById("fabDelete").onclick = () => { closeFabMenu(fabContainer, toggleButton, fabMenu); deleteContact(contact.id); }; 
  toggleButton.onclick = () => toggleFabMenu(fabContainer, toggleButton, fabMenu); 
  document.addEventListener("click", (e) => { if (!fabContainer.contains(e.target)) closeFabMenu(fabContainer, toggleButton, fabMenu); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFabMenu(fabContainer, toggleButton, fabMenu); });
}