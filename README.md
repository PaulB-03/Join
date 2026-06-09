# Join

A Kanban-style project management app built with vanilla JavaScript and Firebase.

## Features

- **Login / Sign-up** — user authentication with guest access
- **Summary** — dashboard overview with task counts, urgent deadlines, and a personalized greeting
- **Board** — drag-and-drop Kanban board with columns: To Do, In Progress, Await Feedback, Done
- **Add Task** — create tasks with title, description, due date, priority, assigned contacts, and subtasks
- **Contacts** — manage team members (add, edit, delete)

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript     |
| Backend  | Firebase Realtime Database (REST)   |
| Fonts    | Inter (self-hosted)                 |

## Project Structure

```
Join/
├── index.html            # Login / Sign-up entry point
├── html/                 # App pages (board, contacts, summary, …)
├── scripts/              # JavaScript modules
│   ├── config.js         # Firebase config & HTTP helpers
│   ├── board.js          # Board logic
│   ├── contacts.js       # Contacts management
│   ├── addTask.js        # Task creation
│   ├── summary.js        # Dashboard
│   └── templates/        # HTML template functions
├── styles/               # Modular CSS (responsive)
└── assets/               # SVG icons & fonts
```

## Getting Started

1. Clone the repo
2. Add your Firebase project credentials to `scripts/config.js`
3. Open `index.html` in a browser — no build step required

## Firebase Setup

The app uses Firebase Realtime Database. The database is structured as:

```
/tasks
/contacts
```

Make sure your Firebase security rules allow read/write for authenticated users.
