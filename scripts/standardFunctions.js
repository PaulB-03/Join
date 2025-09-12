
// all the colors for the contact profile pictures
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


// call this function with a name (string of first and last name) to get the initials
// gets the initials for the profile picture,  called by contactRow
function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// call this function with a name (string of first and last name) to get a color
// function to give the same color for the same name everytime, called by contactRow
function colorForName(name = "") {
  //use empty string if no name is found
  const sum = [...name.trim().toLowerCase()] //convert name to lower case letters and split into characters
    .reduce((acc, ch) => acc + ch.codePointAt(0), 0); // sum the unicode values of each character
  return `var(${COLOR_VARS[sum % COLOR_VARS.length]})`; // use the sum from the unicode values to select a color
}

// Modify loadContacts to store contacts globally for search render
async function loadContactsInAddTask() {
    try {
        let response = await fetch(baseURL + "contacts.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let contacts = await response.json();

        window.loadedContacts = contacts; // store globally for search

        allContacts = [];
        const contactList = document.getElementById("dropdown-list-contacts");
        contactList.innerHTML = "";

        if (contacts) {
            const sortedContacts = Object.entries(contacts).sort((a, b) => {
                const nameA = a[1].name.toUpperCase();
                const nameB = b[1].name.toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });

            sortedContacts.forEach(([key, contact], index) => {
                allContacts.push(contact.name);
            });

            renderContacts(allContacts, contacts);
        }
    } catch (error) {
        console.error("Could not load contacts: ", error);
    }
}