# Slate

> A real-time collaborative technical interview platform.

Slate gives interviewers and candidates a shared workspace for remote technical interviews — a synchronized code editor, whiteboard, private interviewer notes panel, and interview timer, plus live code execution, all in one interface.

---

## Features

- Real-time collaborative code editor
- Shared whiteboard powered by Excalidraw
- Private interviewer notes
- Shared interview timer with pause, resume, and time extension
- Code execution via the OneCompiler API
- Live participant list
- Interviewer-only controls
- Export the workspace (code, notes, whiteboard) as a ZIP archive
- Low-latency sync via Socket.IO
- Automatic room cleanup when the interviewer ends the session

---

## Screenshots
- Home
<img src="/docs/images/Home.png" width="1900" height="907" alt="Image"/>

- Interview Room
<img src="/docs/images/Room.png"  width="1900" height="907" alt="Image"/>

- Whiteboard
<img src="/docs/images/Whiteboard-sync.png"  width="1900" height="907" alt="Image"/>

---

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Socket.IO Client, Monaco Editor, Excalidraw

**Backend:** Node.js, Express, Socket.IO, TypeScript

**External APIs:** OneCompiler API

---

## Getting Started

### Prerequisites

- Node.js 22.12.0+ and npm
- A OneCompiler API key ([get one here](https://onecompiler.com/))

### 1. Clone the repository

```bash
git clone https://github.com/Sayan-Majumdar-06/Slate.git
cd Slate
```

### 2. Install dependencies

```bash
# Frontend
cd Client
npm install

# Backend
cd ../Server
npm install
```

### 3. Configure environment variables

**Server/.env**
```env
API_KEY=your_onecompiler_api_key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Client/.env**
```env
VITE_SERVER_URL=http://localhost:3000
```

### 4. Run the project

You'll need two terminals running at the same time:

```bash
# Terminal 1 — Server
cd Server
npm run dev

# Terminal 2 — Client
cd Client
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
Slate
├── Client
│   ├── src
│   ├── public
│   └── ...
├── Server
│   ├── server.ts
│   └── ...
└── README.md
```

---

## Architecture

```
React + Vite (Client)
        │
Socket.IO Client
        │
   Socket.IO protocol
        │
Express + Socket.IO (Server)
        │
In-memory Room State (Map)
        │
OneCompiler API  ← code execution requests only
```

---

## Workspace Export

The interviewer can export the current session as a ZIP archive containing:

- `Code.txt`
- `Notes.txt`
- `whiteboard.svg`

Useful for archiving interviews locally after the session ends.

---

## Current Limitations

- Room state is in-memory — active rooms are lost on server restart
- No user authentication
- Designed for one interviewer + one candidate per room
- Code execution currently supports C++, JavaScript and Python only

---

## Future Improvements

- User authentication
- Persistent room storage
- Code execution for more widely-used languages
- Collaborative cursors
- Session recording
- AI-powered interview assistance
- Richer presence indicators

---

## Contributing

Contributions, suggestions, and feedback are welcome — feel free to open an issue or submit a pull request.

---

## Author

**Sayan Majumdar**
GitHub: [@Sayan-Majumdar-06](https://github.com/Sayan-Majumdar-06)
