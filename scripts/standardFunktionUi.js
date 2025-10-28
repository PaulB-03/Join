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

  function closeCategoryDropdown() {
  const dropdown = getElementById("assignedToDropdownCategory");
  const arrow = getElementById("dropdown-arrow-subtasks");
  const list = getElementById("dropdown-list-category");
  if (!dropdown || !arrow || !list) return;

  dropdown.classList.remove("open");
  if (list.style.removeProperty) list.style.removeProperty("display"); else list.style.display = "";

  arrow.style.transform = "translateY(-50%) rotate(0deg)";
  resetSubtasksSpacing();
}

  
  function closeContactsDropdown() {
    const dd = getElementById("assignedToDropdownContacts");
    const arrow = getElementById("dropdown-arrow-contacts");
    const list = getElementById("dropdown-list-contacts");
    if (!dd || !arrow || !list) return;
  
    dd.classList.remove("open");
    list.style.display = "none";
    arrow.style.transform = "translateY(-50%) rotate(0deg)";
    resetSubtasksSpacing();
  }
  
  function initCategoryDropdown() {
    const dropdown = getElementById("assignedToDropdownCategory");
    const arrow = getElementById("dropdown-arrow-subtasks");
    const list = getElementById("dropdown-list-category");
    if (!dropdown || !arrow || !list) return;

    let isOpen = false;

    onEvent(dropdown, "click", (ev) => {
      ev.stopPropagation();    
      closeContactsDropdown();    
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
      setDropdownState(arrowElement, dropdownList, trigger, isOpen);
      if (isOpen) attachOutsideCloser(trigger, dropdownList, arrowElement, () => (isOpen = false));
    });
    attachItemHandlers(items, onSelect);
  }
  
  function setDropdownState(arrow, list, trigger, state) {
    if (list) list.style.display = state ? "block" : "none";
    if (arrow) arrow.style.transform = state
      ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
    if (trigger) trigger.classList.toggle("open", state);
    if (!state) resetSubtasksSpacing();
  }
  
  function attachItemHandlers(items, onSelect) {
    Array.from(items || []).forEach((item) =>
      onEvent(item, "click", (ev) => { ev.stopPropagation(); if (onSelect) onSelect(item); })
    );
  }
  
  function attachOutsideCloser(trigger, list, arrow, onClose) {
    const h = (e) => {
      const t = e.target;
      if (trigger.contains(t) || list.contains(t)) return;
      setDropdownState(arrow, list, trigger, false);
      if (onClose) onClose();
      document.removeEventListener("click", h);
    };
    setTimeout(() => document.addEventListener("click", h), 0); // verhindert Sofort-Zuklappen (Chrome)
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
    const list = getAssignedList();
    toggleName(list, name);
  
    const dd = getElementById("assignedToDropdownContacts");
    const isOpen = dd?.classList.contains("open");
    ensureLayoutReferences();
    const before = isOpen && window.__categoryBox ? window.__categoryBox.offsetTop : 0;
  
    updateDropdownText();
    renderAssignedContacts();
    updateDropdownHighlight();
    updateDropdownBackground("assignedToDropdownContacts");
  
    if (isOpen) adjustCategoryBoxAfter(before);
  }
  
  function getAssignedList() {
    return Array.isArray(window.assignedContacts)
      ? window.assignedContacts
      : (window.assignedContacts = []);
  }
  
  function toggleName(list, name) {
    const i = list.indexOf(name);
    i >= 0 ? list.splice(i, 1) : list.push(name);
  }
  
  function adjustCategoryBoxAfter(before) {
    const box = window.__categoryBox;
    if (!box) return;
    const delta = box.offsetTop - before;
    const cur =
      parseFloat(box.style.marginTop) ||
      parseFloat(getComputedStyle(box).marginTop) ||
      0;
    box.style.marginTop = Math.max(0, cur - delta) + "px";
  }  

  /**
   * Renders up to 3 selected contacts as colored initials.
   */
  function renderAssignedContacts() {
    const box = getElementById("assignedToInitials");
    if (!box) return;
    const names = Array.isArray(window.assignedContacts) ? window.assignedContacts : [];
    setInnerHTML(box, "");
    if (!names.length) return hideElement(box);
    showElement(box, "flex");
    addInitials(box, names.slice(0, 3));
    addOverflowCount(box, names);
  }

  function addInitials(box, names) {
    names.forEach(name => {
      const item = document.createElement("span");
      item.className = "contact-initial";
      item.textContent = initials(name);
      item.style.backgroundColor = colorForName(name);
      box.appendChild(item);
    });
  }
  
  function addOverflowCount(box, names) {
    if (names.length <= 3) return;
    const extra = document.createElement("span");
    extra.className = "contact-initial more-count";
    extra.textContent = `+${names.length - 3}`;
    extra.style.backgroundColor = "#999";
    box.appendChild(extra);
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
    const li = makeLi();
    const label = makeLabel(contact);
    onEvent(li, "click", (e) => handleContactClick(e, contact));
    li.appendChild(label);
    return li;
  }

  function makeLi() {
    const li = document.createElement("div");
    li.className = "dropdown-item-contact";
    return li;
  }  

  function makeLabel(contact) {
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
  
    label.append(av, nm, img);
    return label;
  }
  
  function handleContactClick(e, contact) {
    e.stopPropagation();
    toggleContact(contact.name);
    updateDropdownHighlight();
    updateDropdownText();
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

  function setContactsOpen(state) {
    const dd = getElementById("assignedToDropdownContacts");
    const arrow = getElementById("dropdown-arrow-contacts");
    const list = getElementById("dropdown-list-contacts");
    dd.classList.toggle("open", state);
    if (list) list.style.display = state ? "block" : "none";
    if (arrow) arrow.style.transform = state ? "translateY(-50%) rotate(180deg)" : "translateY(-50%) rotate(0deg)";
  }
  
  function attachOutsideCloser() {
    const dd = getElementById("assignedToDropdownContacts");
    const h = (e) => { if (!dd.contains(e.target)) { setContactsOpen(false); resetSubtasksSpacing(); document.removeEventListener("click", h); } };
    setTimeout(() => document.addEventListener("click", h), 0);
  }
  
  function toggleAssignedDropdown(event) {
    const dd = document.getElementById("assignedToDropdownContacts");
    const arrow = document.getElementById("dropdown-arrow-contacts");
    const list = document.getElementById("dropdown-list-contacts");
    if (!dd || !arrow || !list) return;

    event?.stopPropagation?.();

    const isOpen = dd.classList.contains("open");

    function resetLayout() {
      dd.classList.remove("open");
      list.style.display = "none";
      arrow.style.transform = "translateY(-50%) rotate(0deg)";
      if (window.__categoryBox) window.__categoryBox.style.marginTop = "";
      if (window.__subtasksBox) {
        window.__subtasksBox.style.marginTop = "";
        window.__subtasksBox.style.paddingBottom = "";
      }
    }

    if (!isOpen) {
      closeCategoryDropdown?.();
      dd.classList.add("open");
      list.style.display = "block";
      arrow.style.transform = "translateY(-50%) rotate(180deg)";
      if (window.__categoryBox) window.__categoryBox.style.marginTop = "264px";
      if (window.__subtasksBox) {
        window.__subtasksBox.style.marginTop = "24px";
        window.__subtasksBox.style.paddingBottom = "50px";
      }

      window.assignedDropdownHandler = (e) => {
        if (!dd.contains(e.target)) {
          resetLayout();
          document.removeEventListener("pointerdown", window.assignedDropdownHandler, true);
          window.assignedDropdownHandler = null;
        }
      };

      setTimeout(() => document.addEventListener("pointerdown", window.assignedDropdownHandler, true), 0);
    } else {
      resetLayout();
      if (window.assignedDropdownHandler) {
        document.removeEventListener("pointerdown", window.assignedDropdownHandler, true);
        window.assignedDropdownHandler = null;
      }
    }
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
