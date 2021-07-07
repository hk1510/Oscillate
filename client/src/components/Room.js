import React, { useEffect } from 'react'
import { useParams } from "react-router-dom"
import { withRouter } from 'react-router'

const Room = ({ socket, history, setRoomexists}) => {

    let { code } = useParams()

    // TODO: if user joins with link, ask for nickname

    useEffect(() => {
        if (socket) {
            socket.emit("join room if not in room", code)
        }
    }, [code, socket])

    if (socket) {
        socket.on("room does not exist", () => {
            setRoomexists(false)
            history.push("/")
        })
    }

    return (
        <div id="menu">
            <h1>{code}</h1>
        </div>
    )
}

export default withRouter(Room)