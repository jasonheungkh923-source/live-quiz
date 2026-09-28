# live-quiz

Real-time quiz app (React + Node + socket.io)

This repository contains a minimal full-stack implementation of the real-time quiz prototype.

Quick start (development):

1. Clone repo
   git clone https://github.com/jasonheungkh923-source/live-quiz.git
   cd live-quiz

2. Install dependencies for backend and frontend
   cd backend && npm install
   cd ../frontend && npm install

3. Start backend and frontend (in two terminals):
   # Terminal A
   cd backend && npm run dev
   # Terminal B
   cd frontend && npm run dev

4. Open the host page:
   http://localhost:5173/host

Notes
- By default session state is kept in memory. To enable Redis for persistence, set USE_REDIS=true and provide REDIS_URL in backend/.env.
- See README for more details.
