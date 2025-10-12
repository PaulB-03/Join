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

// open the edit contact overlay, called when editing a contact
function openEdit(contact) {
  closeEditDialog(); // close any existing edit dialog to avoid duplicates
  const overlay = makeEditOverlay(); // create a new edit overlay element
  mountAndShow(overlay); // add it to the DOM and display it
  wireCloseHandlers(overlay); // set up handlers to close the overlay
  prefillEditForm(overlay, contact); // fill the form with the contact details from the currently selected contact
  wireLiveAvatar(overlay); // enable live updates of the avatar as the user types
  wireDelete(overlay, contact); // attach delete and save button functionality
  wireSave(overlay, contact);
}

// helpers for openEdit():

// create the edit overlay container element
function makeEditOverlay() { 
  const el = document.createElement("div"); // create the outer overlay div
  el.id = "editOverlay"; // assign an ID for reference
  el.className = "overlay"; // add class for styling
  el.innerHTML = editOverlayHTML(); // set the inner HTML from the template function
  return el; // return the completed overlay element
}

// mount the overlay into the DOM and display it
function mountAndShow(overlay) {
  document.body.appendChild(overlay); // add overlay to the page
  requestAnimationFrame(() => overlay.classList.add("open")); // trigger CSS transition to show it
  document.body.classList.add("modal-open"); // prevent background scrolling
}

// attach click and close event handlers for overlay elements
function wireCloseHandlers(overlay) {
  overlay.addEventListener("click", closeEditDialog); // close when clicking outside panel
  overlay
    .querySelector(".overlay-panel")
    .addEventListener("click", (e) => e.stopPropagation()); // prevent closing when clicking inside
  overlay
    .querySelector(".overlay-close")
    .addEventListener("click", closeEditDialog); // close when clicking the 'X' button
}

// fill the form with the contact details from the currently selected contact
function prefillEditForm(overlay, contact) {
  const form = overlay.querySelector("#editContactForm"); // find the form
  form.elements.name.value = contact.name || ""; // fill name field
  form.elements.email.value = contact.email || ""; // fill email field
  form.elements.phone.value = contact.phone || ""; // fill phone field
  const avatar = overlay.querySelector("#editAvatar"); // setup avatar with contact initials and color
  avatar.textContent = initials(contact.name);
  avatar.style.background = colorForName(contact.name);
}

// update the avatar live as the user types in the name field
function wireLiveAvatar(overlay) {
  const form = overlay.querySelector("#editContactForm");
  const avatar = overlay.querySelector("#editAvatar");
  const update = () => { // define update function for avatar display
    const v = form.elements.name.value; // get current name input
    avatar.textContent = initials(v); // update initials
    avatar.style.background = colorForName(v); // update background color for avatar
  };
  form.elements.name.addEventListener("input", update); // listen for typing changes in the name field
}

// handle delete button click inside the edit overlay
function wireDelete(overlay, contact) {
  overlay
    .querySelector("#editDeleteBtn")
    .addEventListener("click", async () => {
      await deleteContact(contact.id); // delete contact from firebase
      closeEditDialog(); // close overlay after deletion
    });
}

// handle save button and form submission inside edit overlay
function wireSave(overlay, contact) {
  overlay
    .querySelector("#editContactForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault(); // prevent page reload
      const f = e.currentTarget; // get the form element
      const updates = { // read and trim updated values
        name: f.elements.name.value.trim(),
        email: f.elements.email.value.trim(),
        phone: f.elements.phone.value.trim(),
      };
      await updateContact(contact.id, updates); // save updates to firebase
      closeEditDialog();
    });
}

// close and remove the edit contact overlay
function closeEditDialog() {
  const el = document.getElementById("editOverlay");
  if (el) el.remove(); // remove from DOM
  document.body.classList.remove("modal-open"); // allow page scrolling again
}

// check if a contact's phone number is missing or marked as placeholder
function isMissingPhone(phone) {
  return (
    !(phone ?? "").trim() || // empty or undefined
    (phone || "").trim().toLowerCase() === "add phone number" // placeholder text
  );
}

// shorthand helper to get an element by ID
function getById(id) {
  return document.getElementById(id);
}

// open the floating action button (FAB) menu for contact actions
function openFabMenu(fabContainer, toggleButton, menu) {
  fabContainer.classList.add("is-open"); // show the menu
  toggleButton.setAttribute("aria-expanded", "true"); // update ARIA attributes for accessibility
  menu.setAttribute("aria-hidden", "false"); // make menu visible to screen readers
}

// close the floating action button (FAB) menu
function closeFabMenu(fabContainer, toggleButton, menu) {
  fabContainer.classList.remove("is-open"); // hide the menu
  toggleButton.setAttribute("aria-expanded", "false"); // mark as collapsed
  menu.setAttribute("aria-hidden", "true"); // hide from screen readers
}

// toggle the open/closed state of the FAB menu
function toggleFabMenu(fabContainer, toggleButton, menu) {
  if (fabContainer.classList.contains("is-open")) {
    closeFabMenu(fabContainer, toggleButton, menu); // close if open
  } else {
    openFabMenu(fabContainer, toggleButton, menu); // open if closed
  }
}

// setup and wire all floating action button (FAB) menu actions for a contact
function setupContactActionsFab(contact) {
  const fabContainer = getById("contactActionsFab"); // main FAB container
  const toggleButton = getById("contactActionsToggle"); // button to open/close menu
  const fabMenu = getById("contactActionsMenu"); // the menu with action buttons
  if (!fabContainer || !toggleButton || !fabMenu) return; // stop if any elements are missing

  getById("fabEdit").onclick = () => { closeFabMenu(fabContainer, toggleButton, fabMenu); openEdit(contact); }; // wire edit action: close menu and open edit overlay
  getById("fabDelete").onclick = () => { closeFabMenu(fabContainer, toggleButton, fabMenu); deleteContact(contact.id); }; // wire delete action: close menu and delete contact
  toggleButton.onclick = () => toggleFabMenu(fabContainer, toggleButton, fabMenu); // wire toggle button to open/close FAB menu
  document.addEventListener("click", (e) => { if (!fabContainer.contains(e.target)) closeFabMenu(fabContainer, toggleButton, fabMenu); }); // close menu when clicking outside of it
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFabMenu(fabContainer, toggleButton, fabMenu); }); // close menu when pressing the esc key
}