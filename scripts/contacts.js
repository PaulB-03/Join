const COLOR_VARS = [
  "--contact-bg-blue",
  "--contact-bg-light-blue",
  "--contact-bg-light-green",
  "--contact-bg-purple",
  "--contact-bg-lilac",
  "--contact-bg-green",
  "--contact-bg-pink",
  "--contact-bg-red",
  "--contact-bg-rose",
  "--contact-bg-peach",
  "--contact-bg-orange",
  "--contact-bg-light-orange",
  "--contact-bg-dark-yellow",
  "--contact-bg-medium-yellow",
  "--contact-bg-yellow",
];

// conntection to databse
const DB_ROOT =
  "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app";
const CONTACTS_URL = `${DB_ROOT}/contacts.json`;

let contacts = [];

// load contacts, then render
async function loadContacts() {
  const res = await fetch(CONTACTS_URL);
  const obj = await res.json();
  contacts = Object.entries(obj ?? {}).map(([id, c]) => ({ id, ...c }));
  initContactsList();
}

// add a new contact to the database, then reload the list, called by add contact form
async function addContact(contact) {
  await fetch(CONTACTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  await loadContacts(); // refresh list
}

// helpers for setupAddContactOverlay()
function openAddContactDialog() {
  var overlay = document.getElementById("contactOverlay");
  if (overlay) {
    overlay.classList.add("open");
    document.body.classList.add("modal-open");
  }
}
function closeAddContactDialog() {
  var overlay = document.getElementById("contactOverlay"),
    form = document.getElementById("addContactForm");
  if (overlay) {
    overlay.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
  if (form) form.reset();
}
function readAddContactForm() {
  var form = document.getElementById("addContactForm");
  return {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
  };
}
async function submitAddContact(event) {
  event.preventDefault();
  if (!validateAddContactForm()) return; // stop if invalid
  await addContact(readAddContactForm());
  closeAddContactDialog();
}

// setup the add contact overlay, called by init
function setupAddContactOverlay() {
  var overlay = document.getElementById("contactOverlay");
  var form = document.getElementById("addContactForm");
  var openButton = document.getElementById("openAddContact");
  var closeButton = document.getElementById("closeAddContact");
  var cancelButton = document.getElementById("cancelAdd");
  if (openButton) openButton.addEventListener("click", openAddContactDialog);
  if (closeButton) closeButton.addEventListener("click", closeAddContactDialog);
  if (cancelButton)
    cancelButton.addEventListener("click", closeAddContactDialog);
  if (overlay) overlay.addEventListener("click", closeAddContactDialog);
  if (form) form.addEventListener("submit", submitAddContact);
}

function init() {
  includeHTML();
  loadContacts();
  setupAddContactOverlay();
}

// Initialize the contacts list gets called by body onload
function initContactsList() {
  const container = document.querySelector(".contactList");
  if (!container) return;
  const old = container.querySelector(".contactListItems"); // wrapper for items (keeps "Add new contact" button at the top)
  if (old) old.remove();
  const list = document.createElement("div");
  list.className = "contactListItems";
  container.appendChild(list);
  const collator = new Intl.Collator("de", { sensitivity: "base" }); // Sort  group by first letter
  const sorted = [...contacts].sort((a, b) => collator.compare(a.name, b.name));
  const grouped = groupByInitial(sorted);
  Object.keys(grouped).forEach((letter) => {
    list.appendChild(alphaHeader(letter));
    grouped[letter].forEach((c) => list.appendChild(contactRow(c)));
  });
}

// sorts all the names into groups based on their initial letter, gets called by initContactsList
function groupByInitial(items) {
  return items.reduce((acc, c) => {
    const letter = baseLetter(c.name);
    (acc[letter] ||= []).push(c);
    return acc;
  }, {});
}

// makes sure groupByInitial works correctly with letters like Ä or Ö and capitalizes them (a -> A or ä -> Ä -> A) gets called by groupByInitial
function baseLetter(name) {
  const ch = (name?.trim()?.[0] || "#").toUpperCase();
  // changes letters like Ä to A
  return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function alphaHeader(letter) {
  const frag = document.createDocumentFragment();
  const h = document.createElement("div");
  h.className = "alphaHeader";
  h.textContent = letter;
  const divider = document.createElement("div");
  divider.className = "alphaDivider";
  frag.appendChild(h);
  frag.appendChild(divider);
  return frag;
}

// helper function for contactRow() to create each element (contact avatar, name, email)
function createElementWith(tag, cls, text) {
  const element = document.createElement(tag);
  if (cls) element.className = cls;
  if (text != null) element.textContent = text;
  return element;
}

// loads each row in the contact list, called by initContactsList
function contactRow(contact) {
  const row = createElementWith("div", "contactItem"); // outer container
  const avatar = createElementWith(
    "div",
    "contactAvatar",
    initials(contact.name)
  ); // profile picture with initials
  avatar.style.background = colorForName(contact.name); //use colorForName to pick a color
  const text = createElementWith("div", "contactText"); // wrapper container for the text (name and email)
  text.appendChild(createElementWith("div", "contactName", contact.name)); // add name to the container
  text.appendChild(createElementWith("div", "contactEmail", contact.email)); // add email to the container
  row.appendChild(avatar); // add avatar to the current row
  row.appendChild(text); // add email and name to the current row
  row.addEventListener("click", () => selectContact(row, contact)); // add onClick event to select contact
  return row;
}

// gets the initials for the profile picture,  called by contactRow
function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// function to give the same color for the same name everytime, called by contactRow
function colorForName(name = "") {
  //use empty string if no name is found
  const sum = [...name.trim().toLowerCase()] //convert name to lower case letters and split into characters
    .reduce((acc, ch) => acc + ch.codePointAt(0), 0); // sum the unicode values of each character
  return `var(${COLOR_VARS[sum % COLOR_VARS.length]})`; // use the sum from the unicode values to select a color
}

// called by contactRow with onClick
function selectContact(row, contact) {
  document
    .querySelectorAll(".contactItem.is-selected")
    .forEach((el) => el.classList.remove("is-selected")); // clear any previous selection
  row.classList.add("is-selected"); // mark this row
  renderContactDetails(contact); // show details on the right
}

function renderContactDetails(contact) {
  // build the details panel on the right side
  const body = document.querySelector(".contactDetailsBody"); // find the details body
  if (!body) return; // stop if not found
  body.innerHTML = ""; //clear old content
  const top = detailsTop(contact); // build the top section
  const info = detailsInfo(contact); // build the info section
  body.appendChild(top); //add the top section
  body.appendChild(info); // add the info section
}

// top section (avatar, name, action buttons (edit, delete)), called by renderContactDetails
function detailsTop(contact) {
  const top = createElementWith("div", "detailsTop"); // outer container
  const avatar = createElementWith(
    "div",
    "detailsAvatar",
    initials(contact.name)
  ); // profile picture with initials
  avatar.style.background = colorForName(contact.name); //use colorForName to pick a color (so it is the same color as it is in the list)
  const title = createElementWith("div", "detailsTitleWrap"); // container for name and buttons
  title.appendChild(createElementWith("div", "detailsName", contact.name)); // add name
  const actions = createElementWith("div", "detailsActions"); // container for the buttons
  actions.appendChild(
    actionButton("Edit", "../assets/svg/edit.svg", () => openEdit(contact))
  );
  actions.appendChild(
    actionButton("Delete", "../assets/svg/delete.svg", () =>
      deleteContact(contact.id)
    )
  );
  title.appendChild(actions); // place buttons
  top.appendChild(avatar); // add profile picture
  top.appendChild(title); // add name and buttons
  return top;
}

// info section built from template, called by renderContactDetails
function detailsInfoHTML(contact) {
  const phoneIsMissing = isMissingPhone(contact.phone);
  const phoneMarkup = phoneIsMissing
    ? `<a href="#" id="editPhoneTrigger" class="value link">add phone number</a>`
    : `<div class="value">${contact.phone || ""}</div>`;

  return `
    <div class="sectionTitle">Contact Information</div>
    <div class="infoRow"><div class="label">Email</div>
      <a class="value link" href="mailto:${contact.email}">${contact.email}</a>
    </div>
    <div class="infoRow"><div class="label">Phone</div>
      ${phoneMarkup}
    </div>
  `;
}


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

// load the svg file and inline it, called by actionButton
function inlineSvg(url) {
  return fetch(url) // load the svg file (url is from detailsTop())
    .then((r) => r.text()) // get the text content
    .then((txt) => {
      // inline the svg
      const wrap = document.createElement("div"); // create a wrapper container for the svg
      wrap.innerHTML = txt.trim();
      const svg = wrap.querySelector("svg") || document.createElement("span"); // create a placeholder if no svg found
      if (svg.tagName && svg.tagName.toLowerCase() === "svg") {
        // if svg is found
        svg.setAttribute("width", "1em"); //same width as text
        svg.setAttribute("height", "1em"); //same height as text
        svg.classList.add("detailsIcon"); // add class for styling
      }
      return svg;
    });
}

// build a button with an inline svg placed before the label
function actionButton(label, iconUrl, onClick) {
  const btn = createElementWith("button", "detailsAction"); // create the button
  const placeholder = document.createElement("span"); // create a placeholder for the svg
  btn.appendChild(placeholder); // add the placeholder to the button
  btn.appendChild(document.createTextNode(label)); // add the button text
  if (typeof onClick === "function") btn.addEventListener("click", onClick); // add the onClick event
  inlineSvg(iconUrl).then((svg) => placeholder.replaceWith(svg)); // load in the svg
  return btn;
}

// Form validation for add contact form used same style as formValidation.js
const addNameRegex = /^[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿß\s'-]+)+$/;
const addEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const addPhoneRegex = /^\s*$|^\+?[0-9\s\-()]{6,}$/;

// helper for updating error display
function updateFieldError(isValid, inputEl, errorEl) {
  if (!inputEl || !errorEl) return;
  errorEl.style.visibility = isValid ? "hidden" : "visible";
  inputEl.classList.toggle("input-error", !isValid);
  inputEl.setAttribute("aria-invalid", String(!isValid));
}

// get references to the add contact form elements
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

function validateAddContactForm() {
  const { name, email, phone, nameErr, emailErr, phoneErr } =
    getAddContactRefs();
  if (!name || !email || !phone) return false;

  const validName = addNameRegex.test(name.value.trim());
  const validEmail = addEmailRegex.test(email.value.trim());
  const validPhone = addPhoneRegex.test((phone.value || "").trim());

  updateFieldError(validName, name, nameErr);
  updateFieldError(validEmail, email, emailErr);
  updateFieldError(validPhone, phone, phoneErr);

  return validName && validEmail && validPhone;
}

async function deleteContact(id) {
  if (!id) return;
  const res = await fetch(`${DB_ROOT}/contacts/${id}.json`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete contact");
  await loadContacts(); // refresh list
  const body = document.querySelector(".contactDetailsBody");
  if (body) body.innerHTML = ""; // clear details panel
}

function stripId(obj) {
  const { id, ...rest } = obj || {};
  return rest;
}

async function updateContact(id, updates) {
  const existing = contacts.find((c) => c.id === id) || {};
  const payload = stripId({ ...existing, ...updates });
  const res = await fetch(`${DB_ROOT}/contacts/${id}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update contact");
  await loadContacts(); // refresh list
  const updated = contacts.find((c) => c.id === id);
  if (updated) renderContactDetails(updated); // refresh right pane
}

function editOverlayHTML() {
  return `
    <div class="overlay-panel" role="dialog" aria-modal="true">
      <div class="overlay-left">
        <img src="../assets/svg/editContactForm.svg" alt="Edit contact artwork" />
      </div>

      <form id="editContactForm" class="overlay-body" novalidate>
        <button type="button" class="overlay-close" aria-label="Close">×</button>

        <div class="add-contact-overlay-right">
          <div id="editAvatar" class="detailsAvatar"></div>

          <div class="add-contact-overlay-form">
            <div class="field">
              <input name="name" class="has-icon icon-user" placeholder="Name" required>
            </div>
            <div class="field">
              <input name="email" class="has-icon icon-mail" type="email" placeholder="Email" required>
            </div>
            <div class="field">
              <input name="phone" class="has-icon icon-phone" placeholder="Phone">
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
