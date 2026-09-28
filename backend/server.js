// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const shortid = require('shortid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 4000;

// In-memory sessions. For production use Redis (optional, toggled by env).
const sessions = new Map();

function makeSession() {
  const id = shortid.generate().slice(0,6);
  sessions.set(id, {
    hostSocketId: null,
    questions: [],
    current: -1,
    players: new Map(),
    answersCount: {},
    createdAt: Date.now()
  });
  return id;
}

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  socket.on('host-create-session', ({questions}, cb) => {
    const sessionId = makeSession();
    const s = sessions.get(sessionId);
    s.hostSocketId = socket.id;
    s.questions = (questions || []).map((q,i)=> ({...q, id:i}));
    socket.join(sessionId);
    cb && cb({sessionId, joinUrl: `/join?session=${sessionId}`});
    // emit initial player list
    io.to(sessionId).emit('player-list', Array.from(s.players.values()).map(p=>({id:p.id,name:p.name,score:p.score})));
  });

  socket.on('host-attach', ({sessionId}, cb) => {
    const s = sessions.get(sessionId);
    if(!s) return cb && cb({error:'not found'});
    s.hostSocketId = socket.id;
    socket.join(sessionId);
    const players = Array.from(s.players.values()).map(p=>({id:p.id,name:p.name,score:p.score}));
    cb && cb({ok:true, players, current: s.current});
  });

  socket.on('player-join', ({sessionId,name}, cb) => {
    const s = sessions.get(sessionId);
    if(!s) return cb && cb({error:'session not found'});
    const player = {id: socket.id, name: name || '匿名', score:0, answered:false, answer:null};
    s.players.set(socket.id, player);
    socket.join(sessionId);
    const players = Array.from(s.players.values()).map(p=>({id:p.id,name:p.name,score:p.score}));
    io.to(sessionId).emit('player-list', players);
    cb && cb({ok:true, playersCount: s.players.size});
  });

  socket.on('host-start-question', ({sessionId, index}, cb) => {
    const s = sessions.get(sessionId);
    if(!s) return cb && cb({error:'session not found'});
    const idx = (typeof index === 'number') ? index : s.current + 1;
    if(idx < 0 || idx >= s.questions.length) return cb && cb({error:'index out of range'});
    s.current = idx;
    s.answersCount = {};
    s.players.forEach(p => { p.answered = false; p.answer = null; });
    const q = s.questions[idx];
    io.to(sessionId).emit('new-question', {questionId: q.id, text: q.text, choices: q.choices});
    io.to(sessionId).emit('question-started', {index: idx});
    cb && cb({ok:true});
  });

  socket.on('player-answer', ({sessionId, questionId, choiceIndex}, cb) => {
    const s = sessions.get(sessionId);
    if(!s) return cb && cb({error:'session not found'});
    const player = s.players.get(socket.id);
    if(!player) return cb && cb({error:'player not found'});
    if(player.answered) return cb && cb({error:'already answered'});
    const q = s.questions[s.current];
    if(!q || q.id !== questionId) return cb && cb({error:'question mismatch'});
    player.answered = true;
    player.answer = choiceIndex;
    s.answersCount[choiceIndex] = (s.answersCount[choiceIndex] || 0) + 1;
    const totalAnswered = Array.from(s.players.values()).filter(p=>p.answered).length;
    io.to(s.hostSocketId).emit('answer-update', {totalAnswered, answersCount: s.answersCount, playersCount: s.players.size});
    cb && cb({ok:true});
  });

  socket.on('host-reveal', ({sessionId}, cb) => {
    const s = sessions.get(sessionId);
    if(!s) return cb && cb({error:'session not found'});
    const q = s.questions[s.current];
    if(!q) return cb && cb({error:'no current question'});
    let correctCount = 0;
    s.players.forEach(p => {
      if(p.answered && p.answer === q.answerIndex) {
        correctCount += 1;
        p.score = (p.score || 0) + 1;
      }
    });
    const leaderboard = Array.from(s.players.values()).map(p=>({name:p.name,score:p.score})).sort((a,b)=>b.score-a.score);
    io.to(sessionId).emit('reveal', {correctIndex: q.answerIndex, correctCount, totalAnswered: Array.from(s.players.values()).filter(p=>p.answered).length, leaderboard});
    cb && cb({ok:true});
  });

  socket.on('host-end-session', ({sessionId}, cb) => {
    const s = sessions.get(sessionId);
    if(!s) return cb && cb({error:'session not found'});
    io.to(sessionId).emit('session-ended', {});
    sessions.delete(sessionId);
    cb && cb({ok:true});
  });

  socket.on('disconnect', () => {
    sessions.forEach((s, sid) => {
      if(s.players.has(socket.id)) {
        s.players.delete(socket.id);
        io.to(sid).emit('player-list', Array.from(s.players.values()).map(p=>({id:p.id,name:p.name,score:p.score})));
      }
      if(s.hostSocketId === socket.id) {
        s.hostSocketId = null;
        io.to(sid).emit('host-disconnected');
      }
    });
  });
});

server.listen(PORT, ()=> console.log('Backend listening on', PORT));
