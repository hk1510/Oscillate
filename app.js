const express = require("express")
const cors = require("cors")
const http = require("http")
const socketio = require("socket.io")
const Chance = require("chance")
const ytsr = require('ytsr')
const ss = require('socket.io-stream')
const ytdl = require('ytdl-core');

const port = process.env.PORT || 3000
const chance = new Chance()

const app = express()

const server = http.createServer(app)
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
})

const index = require('./routes/index.js')

app.use('/', index)

// TODO: implement user list and playlist in rooms
// TODO: implement audio streaming
// TODO: implement ytdl audio streaming
// TODO: implement room persistence
// TODO: implement user authentication
// TODO: implement chat

// object (map) of rooms
let rooms = {}

// utility function to create and store new room data
const createRoom = () => {
    // a room is identified by its id, which is used to create the room with socket.io
    // this allows multiple rooms to have the same name while still being unique rooms

    let roomCode = ""
    let exists = false

    do {
        roomCode = chance.string({ length: 6, casing: 'upper', alpha: true, numeric: true })
        for (let i = 0; i < rooms.length; i++) {
            if (roomCode === rooms[i].name) {
                exists = true
                break
            }
        }
    } while (exists)

    let room = {
        name: "",
        code: roomCode,
        pass: "",
        playlist: [],
        numClients: 0,
    }
    rooms[roomCode] = room
    return room
}

const setClientNicknames = (roomcode, disconnectingSocket) => {
    let connectedClients = io.of("/").adapter.rooms.get(roomcode)
        let nicknameList
        if (connectedClients) {
            nicknameList = Array.from(connectedClients)
            if (disconnectingSocket) {
                nicknameList = nicknameList.filter((id) => id !== disconnectingSocket.id)
            }
            nicknameList = nicknameList.map((id) => {return {id: id, nickname: io.sockets.sockets.get(id).nickname}})
        }
    io.to(roomcode).emit("set clients", nicknameList)
}

io.on("connection", (socket) => {

    let roomCode
    
    // listen for create public room event
    socket.on("create room", (nickname) => {
        // get data from newly created room
        let newRoom = createRoom()

        // join newly created room
        socket.nickname = nickname
        socket.join(newRoom.code)
        roomCode = newRoom.code
        rooms[newRoom.code].numClients++

        socket.emit("join room", newRoom.code)
    })

    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (rooms[room]) {
                rooms[room].numClients--
                setClientNicknames(room, socket)
                if (rooms[room].numClients === 0) {
                    delete rooms[room]
                }
            }
        }
    })

    socket.on("join room", ({code, nick}) => {
        if (rooms[code]) {
            rooms[code].numClients++
            socket.nickname = nick
            socket.join(code)
            socket.emit("join room", code)
        }
        else {
            socket.emit("room does not exist")
        }
    })

    socket.on("returned to homepage", () => {
        for (const room of socket.rooms) {
            if (rooms[room]) {
                rooms[room].numClients--
                if (rooms[room].numClients === 0) {
                    delete rooms[room]
                }
            }
            if (room !== socket.id) {
                socket.leave(room)
            }
        }
    })

    socket.on("join room if not in room", (code) => {
        if (rooms[code]) {
            let inroom = false
            for (const room of socket.rooms) {
                if (room === code) {
                    inroom=true
                    socket.emit("joined room")
                    console.log("TEST")
                    break
                }
            }
            if (!inroom) {
                socket.emit("get client nickname", code)
            }
        }
        else {
            socket.emit("room does not exist")
        }
    })

    socket.on("set client nickname", ({code, nick}) => {
        if (rooms[code]) {
            rooms[code].numClients++
            socket.nickname = nick
            socket.join(code)
            socket.emit("joined room")
            console.log("test")
        }
        else {
            socket.emit("room does not exist")
        }
    })

    socket.on("get search results", async (query) => {
        try {
            console.log("REACHED SEARCH")
            const filters1 = await ytsr.getFilters(query);
            const filter1 = filters1.get('Type').get('Video');
            const searchResults = await ytsr(filter1.url, {limit: 10});
            socket.emit("set search results", searchResults.items);
            console.log(socket.nickname)
        }
        catch(error) {
            console.log("ERROR: ", error)
            console.log(socket.nickname)
            socket.emit("set search results", [])
        }
    })

    socket.on("get clients", (code) => {
        setClientNicknames(code)
    })

    socket.on("add song to playlist", ({title, duration, url, thumbnail, id, roomCode}) => {        
        rooms[roomCode].playlist.push({title, duration, url, thumbnail, id, votes: 0})
        io.to(roomCode).emit('update playlist', rooms[roomCode].playlist);
    })

    socket.on("get audio", ({videoid}) => {
        const stream = ss.createStream();
        ss(socket).emit("play audio", stream)
        ytdl(`https://www.youtube.com/watch?v=${videoid}`, {filter: 'audioonly'}).pipe(stream)
    })

    socket.on("disconnect", () => {
        setClientNicknames(roomCode)
        console.log("Client disconnected");
    });
});



server.listen(port, () => console.log(`Listening on port ${port}`));