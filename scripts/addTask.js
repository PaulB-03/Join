let baseURL = 'https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/';

function addTask() {
    let title = document.getElementById('titleInput');
    let description = document.getElementById('descriptionInput');
    if (title.value && description.value) {
        const response = saveTask("tasks", {
            "title": title.value,
            "description": description.value,
        });
        if (response) {
            window.location.href = 'board.html';
        }
    } else {
        alert('bitte Felder ausfüllen');
    }
}

async function saveTask(path = "", data = {}) {
    let firebase = await fetch(baseURL + path + ".json", {
        method: "PUT",
        header: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    return firebaseToJson = await firebase.json();
}

document.addEventListener('DOMContentLoaded', init);
function init() {
    let select = document.getElementById('assignedToDropdownContacts');
    let select2 = document.getElementById('assignedToDropdownCategory');
    let dropDownItem2 = document.getElementsByClassName('dropdown-item-category');
    let isClicked = false;
    let arrow = document.querySelector('#dropdown-arrow-contacts');
    let arrow2 = document.querySelector('#dropdown-arrow-subtasks');
    let dropDown = document.getElementById('dropdown-list-contacts');
    let dropDown2 = document.getElementById('dropdown-list-category');
    dropdownFunctionCategory(arrow2, dropDown2, select2, isClicked, dropDownItem2);
    initialiseSavePrioImg();
}

function keepInputBlue(index) {
    let inputField = document.getElementsByClassName('title')[index];
    inputField.addEventListener('input', () => {
        if (inputField.value !== "") {
            inputField.classList.add('blueFrame');
        } else {
            inputField.classList.remove('blueFrame');
        }
    });
}

let selectedPrioImg = [];
isClickedPrio = false;

function initialiseSavePrioImg() {
    let prioRefs = document.getElementsByClassName('prioGrade');
    let prioArray = Array.from(prioRefs);
    prioArray.forEach(element => {
        element.addEventListener('click', () => {
            element.classList.toggle('isClicked');
            let prioImg = element.querySelector('.prioImage');
            let fullImgPath = prioImg.src;
            let localImgPath = fullImgPath.replace(window.location.origin + "/join/", "");
            if (element.classList.contains('isClicked')) {
                selectedPrioImg = [];
                selectedPrioImg.push(localImgPath);
            } else {
                selectedPrioImg = [];
            }
        })
    })
}

function setPrioColor(index) {
    let prioRefs = document.getElementsByClassName('prioGrade');
    let prioRef = prioRefs[index];
    let images = document.querySelectorAll('.prioGrade .prioImage');
    let prioImg = prioRef.querySelector("img");
    let prioImgSource = prioImg.src;


    images.forEach(image => image.classList.remove('filterWhite'));
    Array.from(prioRefs).forEach(element => element.classList.remove('whitePrioFont'));
    if (prioRef.classList.contains('redColor') || prioRef.classList.contains('orangeColor') || prioRef.classList.contains('greenColor')) {
        prioRef.classList.remove('orangeColor', 'greenColor', 'redColor');
        return;
    }
    Array.from(prioRefs).forEach(ref => ref.classList.remove('redColor', 'orangeColor', 'greenColor'));
    addBackgroundColor(prioRef, prioImg);
}

function addBackgroundColor(prioRef, prioImg) {
    prioRef.classList.add(
        prioRef.id === "urgent" ? 'redColor' :
            prioRef.id === "medium" ? 'orangeColor' :
                'greenColor',
        addPrioImgColor(prioRef, prioImg),
    );
    prioGrade = prioRef.id;
}

function addPrioImgColor(prioRef, prioImg) {
    prioRef.classList.add('whitePrioFont');
    prioImg.classList.add('filterWhite');
}

function removePrioImgColor(prioRef, prioImg) {
    prioRef.classList.remove('whitePrioFont');
    prioImg.classList.remove('filterWhite');
}

function dropdownFunctionCategory(arrow2, dropDown2, select2, isClicked, dropDownItem2) {
    select2.addEventListener('click', (event) => {
        event.stopPropagation();
        arrow2.style.transform = isClicked ? "translateY(-50%) rotate(0deg)" : "translateY(-50%) rotate(180deg)";
        dropDown2.style.display = isClicked ? 'none' : 'block';
        isClicked = !isClicked;
    });

    Array.from(dropDownItem2).forEach(item => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            dropDown2.style.display = 'none';
            arrow2.style.transform = isClicked ? "translateY(-50%) rotate(0deg)" : "translateY(-50%) rotate(180deg)";
            isClicked = !isClicked;
        })
    })

    document.body.addEventListener('click', (event) => {
        if (isClicked) {
            arrow2.style.transform = "translateY(-50%) rotate(0deg)";
            dropDown2.style.display = 'none';
            isClicked = false;
        }
    });
}

let selectedCategory = [];
function saveSelectedCategory(index) {
    let categoryInputRef = document.getElementById('categoryPlaceholder');
    let dropDownItem = document.getElementsByClassName('dropdown-item-category')[index];
    let dropDownItemContent = dropDownItem.textContent.trim();
    if (selectedCategory.length === 0) {
        selectedCategory.push(dropDownItemContent);
        categoryInputRef.innerHTML = selectedCategory;
        return
    } else {
        selectedCategory = [];
        selectedCategory.push(dropDownItemContent);
        categoryInputRef.innerHTML = selectedCategory;
        return

    }
}