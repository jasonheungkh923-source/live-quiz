import React from 'react'
import Host from './Host'
import Player from './Player'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

export default function App(){
  return (
    <BrowserRouter>
      <div style={{padding:20}}>
        <h1>Live Quiz</h1>
        <nav style={{marginBottom:20}}>
          <Link to="/host" style={{marginRight:10}}>Host</Link>
          <Link to="/join">Join</Link>
        </nav>
        <Routes>
          <Route path="/host" element={<Host/>} />
          <Route path="/join" element={<Player/>} />
          <Route path="/" element={<div>Open Host or Join</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
