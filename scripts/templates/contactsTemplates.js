/**
 * Generate the HTML for the info section.
 * @param {Contact} contact - Source contact.
 * @returns {string} - HTML string.
 */
function detailsInfoHTML(contact) {
  const phoneIsMissing = isMissingPhone(contact.phone);
  const phoneMarkup = phoneIsMissing ? `<a href="#" id="editPhoneTrigger" class="value link">add phone number</a>` : `<div class="value">${contact.phone || ""}</div>`;
  return `
    <h6 class="sectionTitle">Contact Information</h6>
    <div class="infoRow"><div class="label">Email</div>
      <a class="value link" href="mailto:${contact.email}">${contact.email}</a>
    </div>
    <div class="infoRow"><div class="label">Phone</div>
      ${phoneMarkup}
    </div>
  `;
}

/**
 * Returns the HTML string for the edit contact overlay.
 * @returns {string} HTML markup for the overlay contents.
 */
function editOverlayHTML() {
  return `
    <div class="overlay-panel" role="dialog" aria-modal="true">
      <div class="overlay-left">
        <img src="../assets/svg/editContactForm.svg" alt="Edit contact artwork" id="editContactImgDesktop" />
        <img src="../assets/svg/editContactFormMobile.svg" alt="Edit contact artwork" id="editContactImgMobile" />
      </div>
      <form id="editContactForm" class="overlay-body" novalidate>
        <div id="editAvatar2" class="detailsAvatar editAvtrMbl"></div>
        <button type="button" id="closeEditContact" class="overlay-close" aria-label="Close"><img src="../assets/svg/contactCloseV1.svg" alt=""></button>
        <div class="add-contact-overlay-right">
          <div id="editAvatar" class="detailsAvatar editAvtrDsktp"></div>
          <div class="add-contact-overlay-form">
            <div class="field">
              <input name="name" class="has-icon icon-user input" placeholder="Name" maxlength="28" required>
              <small class="field-error" data-edit-error="name" style="display:none"> Name can’t be empty and must contain only letters (no digits). </small>
            </div>
            <div class="field">
              <input name="email" class="has-icon icon-mail input" type="email" placeholder="Email" maxlength="28" required>
              <small class="field-error" data-edit-error="email" style="display:none"> Use format Name@domain.com </small>
            </div>
            <div class="field">
              <input name="phone" class="has-icon icon-phone input" placeholder="Phone" maxlength="28">
              <small class="field-error" data-edit-error="phone" style="display:none"> Only digits, spaces, +, - or * allowed </small>
            </div>
            <div class="overlay-actions">
              <button type="button" class="btn-white" id="editDeleteBtn">Delete</button>
              <button type="submit" class="btn-dark" id="editSaveBtn">Save <img src="../assets/svg/check.svg" alt="Save icon"></button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;
}
