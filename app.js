const express = require("express")
const http = require("http")
const socketio = require("socket.io")
const Chance = require("chance")

const port = process.env.PORT || 3000
const chance = new Chance()

const app = express();

const server = http.createServer(app)
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
})

// TODO: implement user nicknames
// TODO: implement user list and playlist in rooms
// TODO: implement audio streaming
// TODO: implement ytdl search
// TODO: implement ytdl audio streaming
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

io.on("connection", (socket) => {
    console.log("New client connected");

    console.log(rooms)

    // listen for create public room event
    socket.on("create room", (name) => {
        // get data from newly created room
        let newRoom = createRoom()

        // join newly created room
        socket.join(newRoom.code)
        rooms[newRoom.code].numClients++

        socket.emit("join room", newRoom.code)
    })

    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (rooms[room]) {
                rooms[room].numClients--
                if (rooms[room].numClients === 0) {
                    delete rooms[room]
                }
            }
        }
    })

    socket.on("join room", (code) => {
        if (rooms[code]) {
            rooms[code].numClients++
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
        console.log(rooms)
        console.log(socket.rooms)
    })

    socket.on("join room if not in room", (code) => {
        if (rooms[code]) {
            let inroom = false
            for (const room of socket.rooms) {
                if (room === code) {
                    inroom=true
                    break
                }
            }
            if (!inroom) {
                socket.join(code)
                rooms[code].numClients++
            }
            console.log(rooms)
        }
        else {
            socket.emit("room does not exist")
        }
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});



server.listen(port, () => console.log(`Listening on port ${port}`));