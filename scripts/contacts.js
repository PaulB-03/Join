/**
 * Root URL for the Firebase Realtime Database.
 * @constant {string}
 */
const DB_ROOT = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";

/**
 * Endpoint for the contacts collection.
 * @constant {string}
 */
const CONTACTS_URL = `${DB_ROOT}/contacts.json`;

/**
 * In-memory list of contacts.
 * @type {Array<Contact>}
 */
let contacts = [];

/**
 * A contact record.
 * @typedef {Object} Contact
 * @property {string} [id]
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 */

/**
 * Load contacts from the backend and initialize UI lists.
 * @async
 * @returns {Promise<void>}
 */
async function loadContacts() {
  const res = await fetch(CONTACTS_URL);
  const obj = await res.json();
  contacts = Object.entries(obj ?? {}).map(([id, c]) => ({ id, ...c }));
  initContactsList();
  loadContactsInAddTask();
}

/**
 * Add a new contact to the backend and refresh the UI.
 * @async
 * @param {Contact} contact - Contact payload without an `id`.
 * @returns {Promise<void>}
 */
async function addContact(contact) {
  await fetch(CONTACTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  await loadContacts();
  showContactToast();
}

/**
 * Show a temporary toast notification.
 * @param {string} [message="Contact successfully created"] - Display text.
 * @returns {void}
 */
function showContactToast(message = "Contact successfully created") {
  const toastElement = document.getElementById("contactToast");
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastElement.autoHideTimer);
  toastElement.autoHideTimer = setTimeout(() => toastElement.classList.remove("show"), 2500);
}

/**
 * Open the Add Contact overlay.
 * @returns {void}
 */
function openAddContactDialog() {
  var overlay = document.getElementById("contactOverlay");
  if (overlay) {
    overlay.classList.add("open");
    document.body.classList.add("modal-open");
  }
}

/**
 * Close the Add Contact dialog and reset the form.
 * @returns {void}
 */
function closeAddContactDialog() {
  var overlay = document.getElementById("contactOverlay"),
    form = document.getElementById("addContactForm");
  if (overlay) {
    overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
  if (form) form.reset();
}

/**
 * Read the Add Contact form fields.
 * @returns {{name: string, email: string, phone: string}} Trimmed string values for name, email, and phone.
 */
function readAddContactForm() {
  var form = document.getElementById("addContactForm");
  return {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
  };
}

/**
 * Handle Add Contact form submission.
 * @async
 * @param {SubmitEvent} event
 * @returns {Promise<void>}
 */
async function submitAddContact(event) {
  event.preventDefault();
  if (!validateAddContactForm()) return;
  await addContact(readAddContactForm());
  closeAddContactDialog();
}

/**
 * Initialize Add Contact overlay and handlers.
 * @returns {void}
 */
function setupAddContactOverlay() {
  var overlay = document.getElementById("contactOverlay");
  var form = document.getElementById("addContactForm");
  var openButton = document.getElementById("openAddContact");
  var openFab = document.getElementById("openAddContactFab");
  var closeButton = document.getElementById("closeAddContact");
  var cancelButton = document.getElementById("cancelAdd");
  if (openButton) openButton.addEventListener("click", openAddContactDialog);
  if (openFab) openFab.addEventListener("click", openAddContactDialog);
  if (closeButton) closeButton.addEventListener("click", closeAddContactDialog);
  if (cancelButton) cancelButton.addEventListener("click", closeAddContactDialog);
  if (overlay) overlay.addEventListener("click", closeAddContactDialog);
  if (form) form.addEventListener("submit", submitAddContact);
}

/**
 * Initialize the page.
 * @returns {void}
 */
function init() {
  sidebarHeaderInit();
  loadContacts();
  setupAddContactOverlay();
}

/**
 * Render the contacts list.
 * @returns {void}
 */
function initContactsList() {
  const container = document.querySelector(".contactList");
  if (!container) return;
  const old = container.querySelector(".contactListItems");
  if (old) old.remove();
  const list = document.createElement("div");
  list.className = "contactListItems";
  container.appendChild(list);
  const collator = new Intl.Collator("de", { sensitivity: "base" });
  const sorted = [...contacts].sort((a, b) => collator.compare(a.name, b.name));
  const grouped = groupByInitial(sorted);
  Object.keys(grouped).forEach((letter) => {
    list.appendChild(alphaHeader(letter));
    grouped[letter].forEach((c) => list.appendChild(contactRow(c)));
  });
}

/**
 * Group items by the uppercase base letter of their name.
 * @template T extends {name: string}
 * @param {Array<T>} items - List of items with a `name` field.
 * @returns {Record<string, Array<T>>} Object whose keys are A–Z (or '#') and values are item arrays.
 */
function groupByInitial(items) {
  return items.reduce((acc, c) => {
    const letter = baseLetter(c.name);
    (acc[letter] ||= []).push(c);
    return acc;
  }, {});
}

/**
 * Get the normalized uppercase initial letter for grouping.
 * @param {string} name - Raw name string.
 * @returns {string} Uppercase initial or '#' if empty.
 */
function baseLetter(name) {
  const ch = (name?.trim()?.[0] || "#").toUpperCase();
  return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Create an alphabet header fragment for the list.
 * @param {string} letter - Alphabet letter (e.g., "A").
 * @returns {DocumentFragment} Fragment containing a header and divider.
 */
function alphaHeader(letter) {
  const frag = document.createDocumentFragment();
  const h = document.createElement("h6");
  h.className = "alphaHeader";
  h.textContent = letter;
  const divider = document.createElement("div");
  divider.className = "alphaDivider";
  frag.appendChild(h);
  frag.appendChild(divider);
  return frag;
}

/**
 * Utility to create an element with optional class and text.
 * @param {keyof HTMLElementTagNameMap} tag - Valid HTML tag name.
 * @param {string} [cls] - CSS class to assign.
 * @param {string} [text] - Text content to set.
 * @returns {HTMLElement} The created element instance.
 */
function createElementWith(tag, cls, text) {
  const element = document.createElement(tag);
  if (cls) element.className = cls;
  if (text != null) element.textContent = text;
  return element;
}

/**
 * Build a single contact row element.
 * @param {Contact} contact - Contact data to render.
 * @returns {HTMLDivElement} Row element with click handler attached.
 */
function contactRow(contact) {
  const row = createElementWith("div", "contactItem");
  const avatar = createElementWith("div", "contactAvatar", initials(contact.name));
  avatar.style.background = colorForName(contact.name);
  const text = createElementWith("div", "contactText");
  text.appendChild(createElementWith("h6", "contactName", contact.name));
  text.appendChild(createElementWith("div", "contactEmail", contact.email));
  row.appendChild(avatar);
  row.appendChild(text);
  row.addEventListener("click", () => selectContact(row, contact));
  return row;
}

/**
 * Select a contact and render details.
 * @param {HTMLElement} row - The clicked row element.
 * @param {Contact} contact - The associated contact.
 * @returns {void}
 */
function selectContact(row, contact) {
  document.querySelectorAll(".contactItem.is-selected").forEach((el) => el.classList.remove("is-selected"));
  row.classList.add("is-selected");
  renderContactDetails(contact);
  if (window.innerWidth <= 925) {
    document.querySelector(".contactDetails")?.classList.add("show");
    document.querySelector(".contactList")?.classList.add("hide");
    document.body.classList.add("showing-details");
  }
}

/**
 * Clear the current selected state in the list.
 * @returns {void}
 */
function removeSelected() {
  document.querySelectorAll(".contactItem.is-selected").forEach((el) => el.classList.remove("is-selected"));
}

/**
 * Navigate back to the list view (mobile).
 * @returns {void}
 */
function backToList() {
  document.querySelector(".contactDetails")?.classList.remove("show");
  document.querySelector(".contactList")?.classList.remove("hide");
  const body = document.querySelector(".contactDetailsBody").classList.remove("d_none");
  document.body.classList.remove("showing-details");
  removeSelected();
}

/**
 * Render the details view for a contact.
 * @param {Contact} contact
 * @returns {void}
 */
function renderContactDetails(contact) {
  const body = document.querySelector(".contactDetailsBody");
  if (!body) return;
  body.classList.remove("d_none");
  body.innerHTML = "";
  const top = detailsTop(contact);
  const info = detailsInfo(contact);
  body.appendChild(top);
  body.appendChild(info);
  setupContactActionsFab(contact);
  body.classList.add("showDetails");
}

/**
 * Build the top details section.
 * @param {Contact} contact - The contact whose details to show.
 * @returns {HTMLDivElement} Container element for the top section.
 */
function detailsTop(contact) {
  const top = createElementWith("div", "detailsTop");
  const avatar = createElementWith("div", "detailsAvatar", initials(contact.name));
  avatar.style.background = colorForName(contact.name);
  const title = createElementWith("div", "detailsTitleWrap");
  title.appendChild(createElementWith("div", "detailsName", contact.name));
  const actions = createElementWith("div", "detailsActions");
  actions.appendChild(actionButton("Edit", "../assets/svg/edit.svg", () => openEdit(contact)));
  actions.appendChild(actionButton("Delete", "../assets/svg/delete.svg", () => deleteContact(contact.id)));
  title.appendChild(actions);
  top.appendChild(avatar);
  top.appendChild(title);
  return top;
}

/**
 * Build the info section element for details.
 * @param {Contact} contact - Source contact.
 * @returns {HTMLDivElement} Populated info section element.
 */
function detailsInfo(contact) {
  const info = createElementWith("div", "detailsSection");
  info.innerHTML = detailsInfoHTML(contact);
  const trigger = info.querySelector("#editPhoneTrigger");
  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openEdit(contact);
    });
  }
  return info;
}

/**
 * Load an SVG and return an inline element.
 * @async
 * @param {string} url - relative path to the SVG file.
 * @returns {Promise<SVGSVGElement|HTMLElement>} - Inline SVG or a neutral fallback element.
 */
function inlineSvg(url) {
  return fetch(url)
    .then((r) => r.text())
    .then((txt) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = txt.trim();
      const svg = wrap.querySelector("svg") || document.createElement("span");
      if (svg.tagName && svg.tagName.toLowerCase() === "svg") {
        svg.setAttribute("width", "1em");
        svg.setAttribute("height", "1em");
        svg.classList.add("detailsIcon");
      }
      return svg;
    });
}

/**
 * Create an action button with an icon.
 * @param {string} label - Button text.
 * @param {string} iconUrl - Path to the SVG icon.
 * @param {() => void} [onClick] - Click handler.
 * @returns {HTMLButtonElement} The generated button.
 */
function actionButton(label, iconUrl, onClick) {
  const btn = createElementWith("button", "detailsAction"); // create the button
  const placeholder = document.createElement("span"); // create a placeholder for the svg
  btn.appendChild(placeholder); // add the placeholder to the button
  btn.appendChild(document.createTextNode(label)); // add the button text
  if (typeof onClick === "function") btn.addEventListener("click", onClick); // add the onClick event
  inlineSvg(iconUrl).then((svg) => placeholder.replaceWith(svg)); // load in the svg
  return btn;
}
