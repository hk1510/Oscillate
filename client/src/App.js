import React, { useState, useEffect } from "react"
import {
  HashRouter as Router,
  Switch,
  Route
} from "react-router-dom"
import io from "socket.io-client"
import './App.css'
import Home from "./components/Home"
import Room from "./components/Room"
const ENDPOINT = "http://127.0.0.1:3000/"

function App({ history }) {

  const [socket, setSocket] = useState(null)
  const [nickname, setNickname] = useState("")
  const [roomexists, setRoomexists] = useState(true)

  useEffect(() => {
    setSocket(io.connect(ENDPOINT))
  }, [])

  return (
    <Router>
      <Switch>
        <Route path="/:code">
          <Room socket={socket} roomexists={roomexists} setRoomexists={setRoomexists} nickname={nickname} setNickname={setNickname}/>
        </Route>
        <Route path="/">
          <Home socket={socket} nickname={nickname} setNickname={setNickname} roomexists={roomexists} setRoomexists={setRoomexists}/>
        </Route>
      </Switch>
    </Router>
  );
}

export default App