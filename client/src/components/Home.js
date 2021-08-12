import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router'
import "../App.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'


const Home = ({ socket, history, nickname, setNickname, roomexists, setRoomexists}) => {

    useEffect(() => {
        if (socket) {
            socket.emit("returned to homepage")
        }
    }, [socket])

    const [roomcode, setRoomcode] = useState("")


    const requestRoomCreation = (nickname) => {
        socket.emit("create room", nickname)
    }

    const joinRoom = (code, nickname) => {
        socket.emit("join room", {code: code, nick: nickname})
    }

    if (socket) {
        socket.on("join room", (code) => {
            setRoomexists(true)
            history.push("/" + code)
        })

        socket.on("room does not exist", () => {
            setRoomexists(false)
        })
    }
    if (socket) {
        return (
            <>
                <div id="menu">
                    <h1>oscillate</h1>
                    <p>create and listen to playlists together</p>
                    <div className="itemwrapper">
                        <div className="menuitem">
                            <input id="nicktf" type="text" value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Nickname" />
                        </div>
                        <div className="menuitem">
                            <button id="newroombtn" type="button" onClick={() => {requestRoomCreation(nickname)}}>New Room</button>
                        </div>
                        <div className="menuitem">
                            <input id="codetf" type="text"
                                value={roomcode} onChange={(e) => setRoomcode(e.target.value)}
                                placeholder="Room Code" />
                            <button id="joinbtn" type="button" onClick={() => joinRoom(roomcode, nickname)}>Join Room</button>
                        </div>
                    </div>
                    {roomexists ||
                    <div id="popup">
                        <p>Room does not exist</p>
                        <button onClick={() => {setRoomexists(true)}}>
                            <FontAwesomeIcon icon={faTimes} color="#e4d6a7" size="lg"/>
                        </button>
                    </div>
                    }
                </div>
            </>
        )
    }
    else {
        return (
            <div id="menu">
                <h1>Connecting...</h1>
            </div>
        )
    }

}

export default withRouter(Home)
