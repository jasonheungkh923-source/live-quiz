import React, {useState, useEffect} from 'react'
import { io } from 'socket.io-client'

// backend URL configurable via Vite env var VITE_BACKEND_URL
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
const socket = io(BACKEND)

export default function Player(){
  const [sessionId, setSessionId] = useState('')
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [question, setQuestion] = useState(null);
  const [status, setStatus] = useState('');
  const params = new URLSearchParams(location.search);

  useEffect(()=>{
    const s = params.get('session');
    if(s) setSessionId(s);
    socket.on('new-question', (q)=>{ setQuestion(q); setStatus(''); });
    socket.on('reveal', ({correctIndex, correctCount, totalAnswered})=>{
      setStatus(`Correct: ${correctIndex} ; correctCount: ${correctCount} ; answered: ${totalAnswered}`);
    });
    return ()=>{ socket.off('new-question'); socket.off('reveal'); }
  },[])

  const join = ()=>{
    if(!sessionId) return alert('missing session id');
    socket.emit('player-join', {sessionId, name}, (res)=>{
      if(res.error) return alert(res.error);
      setJoined(true);
    });
  }

  const answer = (i)=>{
    if(!question) return;
    socket.emit('player-answer', {sessionId, questionId: question.questionId, choiceIndex: i}, (res)=>{
      if(res.error) return alert(res.error);
      setStatus('Answered, waiting reveal...');
    });
  }

  return (
    <div>
      <h2>Join</h2>
      {!joined && (
        <div>
          <div>Session: <input value={sessionId} onChange={e=>setSessionId(e.target.value)} /></div>
          <div>Name: <input value={name} onChange={e=>setName(e.target.value)} /></div>
          <button onClick={join}>Join</button>
        </div>
      )}

      {joined && (
        <div>
          <h3>Session {sessionId}</h3>
          {question ? (
            <div>
              <h4>{question.text}</h4>
              {question.choices.map((c,i)=> <button key={i} onClick={()=>answer(i)} style={{display:'block',margin:6}}>{c}</button>)}
            </div>
          ) : <div>Waiting for question...</div>}
          <div>{status}</div>
        </div>
      )}
    </div>
  )
}
