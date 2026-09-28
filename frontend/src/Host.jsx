import React, {useState, useEffect, useRef} from 'react'
import io from 'socket.io-client'
import QRCode from 'qrcode'

const socket = io('http://localhost:4000')

export default function Host(){
  const [questionsText, setQuestionsText] = useState(`[{\n  "text":"首都在哪裡？","choices":["台北","東京","倫敦","紐約"],"answerIndex":0\n},{\n  "text":"2+2=?","choices":["3","4","5","6"],"answerIndex":1\n}]`)
  const [sessionId, setSessionId] = useState(null)
  const [players, setPlayers] = useState([])
  const qrcodeRef = useRef()
  const [answeredCount, setAnsweredCount] = useState('0 / 0')
  const [counts, setCounts] = useState({})

  useEffect(()=>{
    socket.on('player-list', (pl)=>{ setPlayers(pl); });
    socket.on('answer-update', ({totalAnswered, answersCount, playersCount})=>{
      setAnsweredCount(`${totalAnswered} / ${playersCount}`);
      setCounts(answersCount||{});
    });
    socket.on('reveal', ({leaderboard})=>{ setPlayers(leaderboard); });
    return ()=>{ socket.off('player-list'); socket.off('answer-update'); socket.off('reveal'); }
  },[])

  const create = ()=>{
    let questions;
    try{ questions = JSON.parse(questionsText); }
    catch(e){ alert('JSON parse error'); return; }
    socket.emit('host-create-session', {questions}, (res)=>{
      setSessionId(res.sessionId);
      const url = (location.origin.replace(/:\d+$/,'') || 'http://localhost:5173') + `/join?session=${res.sessionId}`
      QRCode.toCanvas(qrcodeRef.current, url).catch(console.error)
    })
  }

  const startNext = ()=>{ socket.emit('host-start-question', {sessionId}, (r)=> r.error && alert(r.error)); }
  const reveal = ()=>{ socket.emit('host-reveal', {sessionId}, (r)=> r.error && alert(r.error)); }
  const end = ()=>{ socket.emit('host-end-session', {sessionId}, (r)=>{ if(r.ok) window.location.reload(); }); }

  return (
    <div>
      <h2>Host</h2>
      {!sessionId && (
        <div>
          <textarea rows={8} cols={80} value={questionsText} onChange={e=>setQuestionsText(e.target.value)} />
          <div><button onClick={create}>Create Session</button></div>
        </div>
      )}
      {sessionId && (
        <div>
          <div>Session: {sessionId}</div>
          <div>Join URL: <a href={`/join?session=${sessionId}`}>{`/join?session=${sessionId}`}</a></div>
          <div ref={qrcodeRef}></div>
          <div style={{marginTop:10}}>
            <button onClick={startNext}>Start Next</button>
            <button onClick={reveal}>Reveal</button>
            <button onClick={end}>End</button>
          </div>
          <div>
            <h4>Stats</h4>
            <div>Players: {players.length}</div>
            <div>Answered: {answeredCount}</div>
            <div>
              {Object.keys(counts).map(k=> <div key={k}>Choice {k}: {counts[k]}</div>)}
            </div>
          </div>
          <div>
            <h4>Leaderboard</h4>
            <ol>
              {players.sort((a,b)=>b.score-a.score).map((p,i)=> <li key={i}>{p.name} ({p.score})</li>)}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
