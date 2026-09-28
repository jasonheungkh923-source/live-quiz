# live-quiz

Real-time quiz app (React + Node + socket.io)

This repository contains a minimal full-stack implementation of the real-time quiz prototype.

Quick start (development):

1. Clone repo
   ```bash
   git clone https://github.com/jasonheungkh923-source/live-quiz.git
   cd live-quiz
   ```

2. Install dependencies for backend and frontend
   ```bash
   npm run install-all
   # or
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Start backend and frontend (in two terminals):
   # Terminal A
   ```bash
   cd backend
   cp .env.example .env   # optional
   npm run dev
   ```

   # Terminal B
   ```bash
   cd frontend
   # optionally set VITE_BACKEND_URL (see below)
   npm run dev
   ```

4. Open the host page:
   - Host: http://localhost:5173/host
   - Player (example): http://localhost:5173/join?session=XXXXXX

Environment variables
- Backend: see `backend/.env.example` for available variables (PORT, USE_REDIS, REDIS_URL).
- Frontend: to point the frontend to a backend other than `http://localhost:4000`, set Vite env var `VITE_BACKEND_URL` before running the dev server or building:
  ```bash
  # Example (Linux / macOS)
  export VITE_BACKEND_URL="http://your-backend-host:4000"
  # then start dev server
  cd frontend && npm run dev
  ```
  When building for production, the same env `VITE_BACKEND_URL` will be embedded into the built files.

Production (serve built frontend from backend)
1. Build frontend
   ```bash
   cd frontend
   npm run build
   ```

2. Copy `dist` to backend public folder (backend serves static files)
   ```bash
   rm -rf ../backend/public/*
   cp -r dist/* ../backend/public/
   ```

3. Set `VITE_BACKEND_URL` (if necessary) and start backend
   ```bash
   cd ../backend
   # ensure .env has PORT set (default 4000)
   npm start
   ```

Notes
- Frontend connects to the backend via the `VITE_BACKEND_URL` env var. If not provided it defaults to `http://localhost:4000` for convenience in development.
- Current session and leaderboard state are in-memory. For production, enable Redis and use the redis adapter (I can add docker-compose and Redis support if you want).

Next steps you can ask me to do
- Add Redis persistence + docker-compose
- Improve host UI (timers, automatic reveal, question editor)
- Add authentication for host/players

