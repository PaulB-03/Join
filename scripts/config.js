/**
 * Root URL for the Firebase Realtime Database.
 * @constant {string}
 */
const DB_ROOT = "https://join-1323-default-rtdb.europe-west1.firebasedatabase.app/";

/**
 * Endpoint for the contacts collection.
 * @constant {string}
 */
const CONTACTS_URL = `${DB_ROOT}/contacts.json`;

const firebaseConfig = {
    apiKey: "…",
    authDomain: "…",
    databaseURL: DB_ROOT,
    projectId: "…",
    storageBucket: "…",
    messagingSenderId: "…",
    appId: "…",
  };
  firebase.initializeApp(firebaseConfig);
  window.rtdb = firebase.database();

  /**
 * Sends a GET request to the Firebase Realtime Database and returns parsed JSON.
 *
 * @param {string} path
 * @returns {Promise<any>}
 * @throws {Error}
 */
async function httpGetJson(path) {
  const response = await fetch(DB_ROOT + path);
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.json();
}

/**
 * Sends a POST request with a JSON body to the Firebase database.
 *
 * @param {string} path
 * @param {Object} body
 * @returns {Promise<any>}
 * @throws {Error}
 */
async function httpPostJson(path, body) {
  const response = await fetch(DB_ROOT + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${path} -> ${response.status}`);
  return response.json();
}

/**
 * Sends a PATCH request with a JSON body to the Firebase database.
 *
 * @param {string} path
 * @param {Object} body
 * @returns {Promise<any>}
 * @throws {Error}
 */
async function httpPatchJson(path, body) {
  const response = await fetch(DB_ROOT + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`PATCH ${path} -> ${response.status}`);
  return response.json();
}

/**
 * Loads contact data into the "Add Task" view.
 *
 * - fetches from Firebase
 * - populates global lists (assigned to `window` only if _you_ später willst; hier lokal)
 * - triggers rendering via `renderContacts`
 *
 * @returns {Promise<void>}
 */
async function loadContactsInAddTask() {
  try {
    const contacts = await httpGetJson("contacts.json");
    const list = document.getElementById("dropdown-list-contacts");
    if (!contacts || !list) return;
    const allContacts = Object.values(contacts)
      .map((c) => c.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    renderContacts(allContacts, contacts);
  } catch (e) {
    console.error("Could not load contacts:", e);
  }
}
