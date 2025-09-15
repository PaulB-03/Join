document.addEventListener('DOMContentLoaded', () => {
    initCategoryDropdown();
    initContactsDropdown();
    initialiseSavePrioImg();
});

function initialiseSavePrioImg() {
    let prioRefs = document.getElementsByClassName('prioGrade');
    let prioArray = Array.from(prioRefs);

    prioArray.forEach(element => {
        element.addEventListener('click', () => {
            prioArray.forEach(el => el.classList.remove('isClicked'));
            
            if (element.classList.contains('isClicked')) {
                element.classList.remove('isClicked');
                selectedPrio = "";
            } else {
                element.classList.add('isClicked');
                selectedPrio = element.id;
            }
        });
    });
}

window.addEventListener("load", () => {
    loadContacts();
});

document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('titleInput');

  titleInput.addEventListener('input', () => {
    if (titleInput.value.trim() !== "") {
      titleInput.classList.add('filled');
    } else {
      titleInput.classList.remove('filled');
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
});

function saveSelectedCategory(index) {
    const dropdown = document.getElementById("assignedToDropdownCategory");
    const categoryList = document.getElementById("dropdown-list-category");
    dropdown.classList.remove("open");
    if (subtasksContainer) {
        subtasksContainer.style.marginTop = subtasksOriginalStyles.marginTop;
        subtasksContainer.style.paddingBottom = subtasksOriginalStyles.paddingBottom;
    }
    const selectedText = categoryList.children[index].querySelector("label").textContent.trim();
    document.getElementById("categoryPlaceholder").textContent = selectedText;
    dropdown.classList.add("selected");
}