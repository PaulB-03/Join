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
