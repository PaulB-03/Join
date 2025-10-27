(() => {
  /* ----------- Tasks API ----------- */

  /**
   * Fetches all tasks from the database.
   */
  async function getTasks() {
    try {
      return (await httpGetJson("tasks.json")) || {};
    } catch (err) {
      console.error("Could not get tasks:", err);
      return null;
    }
  }

  /**
   * Saves a task to the database under the given path.
   */
  async function saveTask(path, data) {
    return httpPostJson(path + ".json", data);
  }

  /* ----------- Category Dropdown ----------- */

  /**
   * Initializes the category dropdown UI behavior.
   */
  function initCategoryDropdown() {
    const dropdown = getElementById("assignedToDropdownCategory");
    const arrow = getElementById("dropdown-arrow-subtasks");
    const list = getElementById("dropdown-list-category");
    if (!dropdown || !arrow || !list) return;

    let isOpen = false;

    onEvent(dropdown, "click", (ev) => {
      ev.stopPropagation();
      isOpen = !isOpen;
      dropdown.classList.toggle("open", isOpen);
      arrow.style.transform = isOpen
        ? "translateY(-50%) rotate(180deg)"
        : "translateY(-50%) rotate(0deg)";
      if (isOpen) adjustForDropdown(list);
      if (!isOpen) resetSubtasksSpacing();
    });

    querySelectorAll(".dropdown-item-category", list).forEach((item, index) =>
      onEvent(item, "click", (ev) => {
        ev.stopPropagation();
        selectCategory(index);
        close();
      })
    );

    onEvent(document, "click", () => isOpen && close());

    function close() {
      dropdown.classList.remove("open");
      arrow.style.transform = "translateY(-50%) rotate(0deg)";
      isOpen = false;
      resetSubtasksSpacing();
    }

    function adjustForDropdown(listElement) {
      ensureLayoutReferences();
      const subtasksBox = window.__subtasksBox;
      if (subtasksBox) {
        subtasksBox.style.marginTop = listElement.offsetHeight + 16 + "px";
        subtasksBox.style.paddingBottom = "50px";
      }
    }
  }

  /**
   * Sets the selected category and updates UI text.
   */
  function selectCategory(index) {
    const categories = ["Userstory", "Technical Task"];
    const dropdown = getElementById("assignedToDropdownCategory");
    const placeholder = getElementById("categoryPlaceholder");
    window.selectedCategory = categories[index];
    setTextContent(placeholder, window.selectedCategory);
    dropdown?.classList.add("selected-red");
    resetSubtasksSpacing();
  }

  /* ----------- Contact Dropdown Core ----------- */

  /**
   * Provides open/close behavior for dropdowns.
   */
  function dropdownFunction(arrowElement, dropdownList, trigger, items, onSelect) {
    let isOpen = false;

    onEvent(trigger, "click", (ev) => {
      ev.stopPropagation();
      isOpen = !isOpen;
      dropdownList.style.display = isOpen ? "block" : "none";
      arrowElement.style.transform = isOpen
        ? "translateY(-50%) rotate(180deg)"
        : "translateY(-50%) rotate(0deg)";
    });

    Array.from(items).forEach((item) =>
      onEvent(item, "click", (ev) => {
        ev.stopPropagation();
        if (onSelect) onSelect(item);
      })
    );

    onEvent(document, "click", (e) => {
      if (!isOpen) return;
      const t = e.target;
      if (trigger.contains(t) || dropdownList.contains(t)) return;
      isOpen = false;
      dropdownList.style.display = "none";
      arrowElement.style.transform = "translateY(-50%) rotate(0deg)";
      resetSubtasksSpacing();
      trigger.classList.remove("open");
    }, true);
  }

  /**
   * Updates the visible text of selected contacts in the dropdown button.
   */
  function updateDropdownText() {
    const span = querySelector("#assignedToDropdownContacts .dropdown-selected span");
    if (!span) return;
    const names = Array.isArray(window.assignedContacts) ? [...window.assignedContacts] : [];
    if (!names.length) { span.textContent = "Select contacts"; return; }
    const out = [];
    for (let i = 0; i < names.length; i++) {
      out.push(names[i]);
      span.textContent = out.join(", ");
      if (span.scrollWidth > span.clientWidth) { out.pop(); break; }
    }
    span.textContent = out.join(", ");
  }

  /**
   * Highlights selected contacts inside the dropdown list.
   */
  function updateDropdownHighlight() {
    const list = getElementById("dropdown-list-contacts");
    if (!list) return;
    querySelectorAll("label.dropdown-checkbox", list).forEach((label) => {
      const name = querySelector("span.contact-name", label)?.textContent?.trim() || "";
      const img = querySelector("img.checkbox-svg", label);
      const sel = window.assignedContacts?.includes(name);
      const item = label.closest(".dropdown-item-contact");
      if (img) {
        img.src = sel ? "../assets/svg/checked.svg" : "../assets/svg/check_button.svg";
        img.classList.toggle("checked", sel);
      }
      label.style.color = sel ? "white" : "";
      if (item) item.classList.toggle("selected", sel);
    });
  }

  /**
   * Highlights the dropdown trigger if any contacts are selected.
   */
  function updateDropdownBackground(dropdownId) {
    const d = getElementById(dropdownId);
    if (!d) return;
    const checked = d.querySelectorAll("img[src*='checked.svg']").length > 0;
    d.classList.toggle("selected", checked);
  }

  /* ----------- Contact Selection ----------- */

  /**
   * Toggles a contact in the selected list and updates UI.
   */
  function toggleContact(name) {
    const list = Array.isArray(window.assignedContacts)
      ? window.assignedContacts
      : (window.assignedContacts = []);

    const i = list.indexOf(name);
    i >= 0 ? list.splice(i, 1) : list.push(name);

    const dd = getElementById("assignedToDropdownContacts");
    const isOpen = dd && dd.classList.contains("open");
    ensureLayoutReferences();
    const before = isOpen && window.__categoryBox ? window.__categoryBox.offsetTop : 0;

    updateDropdownText();
    renderAssignedContacts();
    updateDropdownHighlight();
    updateDropdownBackground("assignedToDropdownContacts");

    if (isOpen && window.__categoryBox) {
      const delta = window.__categoryBox.offsetTop - before;
      const cur = parseFloat(window.__categoryBox.style.marginTop)
        || parseFloat(getComputedStyle(window.__categoryBox).marginTop)
        || 0;
      window.__categoryBox.style.marginTop = Math.max(0, cur - delta) + "px";
    }
  }

  /**
   * Renders up to 3 selected contacts as colored initials.
   */
  function renderAssignedContacts() {
    const box = getElementById("assignedToInitials");
    if (!box) return;
    setInnerHTML(box, "");
    const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : [];
    if (!names.length) { hideElement(box); return; }
    showElement(box, "flex");
    const max = Math.min(names.length, 3);
    for (let i = 0; i < max; i++) {
      const s = document.createElement("span");
      s.className = "contact-initial";
      s.textContent = initials(names[i]);
      s.style.backgroundColor = colorForName(names[i]);
      box.appendChild(s);
    }
    if (names.length > 3) {
      const m = document.createElement("span");
      m.className = "contact-initial more-count";
      m.textContent = `+${names.length - 3}`;
      m.style.backgroundColor = "#999";
      box.appendChild(m);
    }
  }

  /* ----------- Contact Loading ----------- */

  /**
   * Loads contact data and renders dropdown list.
   */
  async function loadContactsInAddTask() {
    try {
      const contacts = await httpGetJson("contacts.json");
      const list = getElementById("dropdown-list-contacts");
      if (!contacts || !list) return;
      window.loadedContacts = contacts;
      window.allContacts = Object.values(contacts)
        .map((c) => c.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      renderContacts(window.allContacts, contacts);
    } catch (e) {
      console.error("Could not load contacts:", e);
    }
  }

  /**
   * Renders the contact list dropdown UI.
   */
  function renderContacts(names, contacts) {
    const list = getElementById("dropdown-list-contacts");
    if (!list) return;
    setInnerHTML(list, "");
    names.forEach((name) => {
      const entry = Object.values(contacts).find((c) => c.name === name);
      if (entry) list.appendChild(createContactListItem(entry));
    });
  }

  /**
   * Creates a list item for one contact in the dropdown list.
   */
  function createContactListItem(contact) {
    const li = document.createElement("li");
    li.className = "dropdown-item-contact";

    const label = document.createElement("label");
    label.className = "dropdown-checkbox";

    const av = document.createElement("span");
    av.className = "contact-initial";
    av.textContent = initials(contact.name);
    av.style.backgroundColor = colorForName(contact.name);

    const nm = document.createElement("span");
    nm.className = "contact-name";
    nm.textContent = contact.name;

    const img = document.createElement("img");
    img.className = "checkbox-svg";
    img.src = (window.assignedContacts || []).includes(contact.name)
      ? "../assets/svg/checked.svg"
      : "../assets/svg/check_button.svg";

    onEvent(li, "click", (e) => {
      e.stopPropagation();
      img.src = img.src.includes("check_button.svg")
        ? "../assets/svg/checked.svg"
        : "../assets/svg/check_button.svg";
      toggleContact(contact.name);
    });

    label.append(av, nm, img);
    li.appendChild(label);
    return li;
  }

  /**
   * Loads contacts and sets up dropdown behavior.
   */
  async function initContactsDropdown() {
    const select = getElementById("assignedToDropdownContacts");
    const arrow = getElementById("dropdown-arrow-contacts");
    const drop = getElementById("dropdown-list-contacts");
    if (!select || !arrow || !drop) return;
    try {
      const contacts = await httpGetJson("contacts.json");
      window.loadedContacts = contacts;
      const names = Object.values(contacts)
        .map((c) => c.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setInnerHTML(drop, "");
      names.forEach((n) => drop.appendChild(createContactListItem({ name: n })));
      const items = document.getElementsByClassName("dropdown-item-contact");
      dropdownFunction(arrow, drop, select, items, null);
    } catch (e) {
      console.error("initContactsDropdown failed:", e);
    }
  }

  /* ----------- Dropdown Spacing ----------- */

  /**
   * Toggles the contacts dropdown and adjusts spacing.
   */
  function toggleAssignedDropdown(ev) {
    const dd = getElementById("assignedToDropdownContacts");
    if (!dd) return;
    ev?.stopPropagation();
    ensureLayoutReferences();
    const open = !dd.classList.contains("open");
    dd.classList.toggle("open", open);
    if (open) {
      if (window.__categoryBox) window.__categoryBox.style.marginTop = "264px";
      if (window.__subtasksBox) {
        window.__subtasksBox.style.marginTop = "24px";
        window.__subtasksBox.style.paddingBottom = "50px";
      }
      const h = (e) => {
        if (dd.contains(e.target)) return;
        dd.classList.remove("open");
        resetSubtasksSpacing();
        document.removeEventListener("click", h);
      };
      setTimeout(() => document.addEventListener("click", h), 0);
    } else resetSubtasksSpacing();
  }

  /* ----------- Auto Init ----------- */

  /**
   * Initializes category dropdown on DOM load.
   */
  document.addEventListener("DOMContentLoaded", () => {
    initCategoryDropdown();
  });

  /* ----------- Global API Bindings ----------- */

  window.getTasks ??= getTasks;
  window.saveTask ??= saveTask;
  window.initCategoryDropdown ??= initCategoryDropdown;
  window.selectCategory ??= selectCategory;
  window.dropdownFunction ??= dropdownFunction;
  window.updateDropdownText ??= updateDropdownText;
  window.updateDropdownHighlight ??= updateDropdownHighlight;
  window.updateDropdownBackground ??= updateDropdownBackground;
  window.toggleContact ??= toggleContact;
  window.renderAssignedContacts ??= renderAssignedContacts;
  window.loadContactsInAddTask ??= loadContactsInAddTask;
  window.renderContacts ??= renderContacts;
  window.createContactListItem ??= createContactListItem;
  window.initContactsDropdown ??= initContactsDropdown;
  window.toggleAssignedDropdown ??= toggleAssignedDropdown;
  window.initialiseSavePrioImg ??= window.initialiseSavePrioImg;
})();
