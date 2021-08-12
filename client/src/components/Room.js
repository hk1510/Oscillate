import React, { useState, useEffect, useMemo} from 'react'
import { useParams } from "react-router-dom"
import { withRouter } from 'react-router'
import { v4 as uuidv4 } from 'uuid'
import ss from "socket.io-stream"

const Room = ({ socket, history, setRoomexists, nickname, setNickname}) => {

    let { code } = useParams()

    const [roomStatus, setRoomStatus] = useState("JOINING ROOM")

    const [clients, setClients] = useState([])

    const [query, setQuery] = useState("")

    const [results, setResults] = useState([])

    const [loading, setLoading] = useState(false)

    const [playlist, setPlaylist] = useState([])

    const [isPlaying, setIsPlaying] = useState(false)

    // TODO: if user joins with link, ask for nickname

    const roomDoesNotExistListener = () => {
        setRoomexists(false)
        history.push("/")
    } 
    
    const joinedRoomListener = () => {
        console.log("GETTING CLIENTS")
        setLoading(false)
        setRoomStatus("SUCCESS")
    }

    const getClientNicknameListener = () => {
        setRoomStatus("GET CLIENT NICK")
    }

    const setClientsListener = (clientList) => {
        setClients(clientList)
    }

    const setSearchResultsListener = (searchResults) => {
        setLoading(false)
        setResults(searchResults)
    }

    const updatePlaylistListener = (playlist) => {
        setPlaylist(playlist)
    }


    // https://github.com/nkzawa/socket.io-stream/issues/73

    const handlePlayAudio = (stream) => {
        let audio = document.getElementById('audio-player')
        let parts = []
        stream.on('data', (chunk) => {
            parts.push(chunk)
        })
        stream.on('end', () => {
            audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts))
            audio.play()
        })
    }

    useEffect(() => {

        if (socket) {
            socket.on("room does not exist", roomDoesNotExistListener)

            socket.on("joined room", joinedRoomListener)

            socket.on("get client nickname", getClientNicknameListener)

            socket.on("set clients", setClientsListener)

            socket.on("set search results", setSearchResultsListener)

            socket.on("update playlist", updatePlaylistListener)

            ss(socket).on("play audio", handlePlayAudio)
        }

        return () => { 
        
            if (socket) {
                socket.off("room does not exist", roomDoesNotExistListener)

                socket.off("joined room", joinedRoomListener)

                socket.off("get client nickname", getClientNicknameListener)

                socket.off("set clients", setClientsListener)

                socket.off("set search results", setSearchResultsListener)

                socket.off("update playlist", updatePlaylistListener)

                ss(socket).off("play audio", handlePlayAudio)
            }
        }
    }, [socket, history, setRoomexists])

    useEffect(() => {
        if (socket) {
            socket.emit("join room if not in room", code)
        }
    }, [code, socket])

    useEffect(() => {
        if (socket) {
            if (roomStatus === "SUCCESS") {
                socket.emit("get clients", code)
                console.log("ACTUALLY GETTING CLIENTS")
            }
        }
    }, [code, socket, roomStatus])

    function debounce(callback, wait, immediate = false) {
        let timeout = null 
        
        return function() {
            const callNow = immediate && !timeout
            const next = () => callback.apply(this, arguments)
            
            clearTimeout(timeout)
            timeout = setTimeout(next, wait)

            if (callNow) {
            next()
            }
        }
    }

    const getResults = useMemo(() =>
        debounce(async (searchQuery) => {
            if (socket) {
                socket.emit("get search results", searchQuery)
            }
        }, 300), 
    [])

    useEffect(() => {
        setLoading(true)
        getResults(query)
    }, [query, socket])

    const joinRoom = (code, nickname) => {
        socket.emit("set client nickname", {code: code, nick: nickname})
    }

    const addSong = (title, duration, url, thumbnail) => {
        socket.emit("add song to playlist", {title, duration, url, thumbnail, id: uuidv4(), roomCode: code})
    }

    const SearchResult = ({title, url, thumbnail, isLive, duration}) => {
        return (
            <div className="searchResult">
                <img className="thumbnail" src={thumbnail} alt="thumbnail"/>
                <div className="srDetails">
                    <p className="songTitle">{title}</p>
                    {
                        duration &&
                        <p className="songDuration">{duration}</p>
                    }
                    {
                        isLive &&
                        <p className="songLive">Live</p>
                    }
                </div>
                <button className="addButton" onClick={() => addSong(title, duration, url, thumbnail)}>Add</button>
            </div>
        )
    }

    const togglePlay = () => {
        let playing = isPlaying
        setIsPlaying(!isPlaying)
        if (!playing) {
            if (socket) {
                socket.emit("get audio", { videoid: "pxaVJRY3Sd4" })
            }
        }
    }
    
    switch(roomStatus) {
        case "JOINING ROOM":
            return (
                <div id="menu">
                    <h1>Joining Room...</h1>
                </div>
            )
        case "GET CLIENT NICK":
            return (
                <div id="menu">
                    <div className="itemwrapper">
                        <div className="menuitem">
                            <input id="codetf" type="text"
                                value={nickname} onChange={(e) => setNickname(e.target.value)}
                                placeholder="Nickname" />
                            <button id="joinbtn" type="button" onClick={() => joinRoom(code, nickname)}>Set</button>
                        </div>
                    </div>
                </div>
            )
        default:
            return (
                <div id="main">
                    <div id="view">
                        <div id="leftBar">
                            <input id="search" type="text"
                                value={query} onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search" />
                            <div id="searchResults">
                                {
                                    loading 
                                    ?
                                        <h1>Loading...</h1>
                                    :
                                    results.length > 0 ?
                                    results.map((result) => {
                                        let id = uuidv4()
                                        return(
                                            <SearchResult
                                                title={result.title}
                                                url={result.url}
                                                thumbnail={result.bestThumbnail.url}
                                                isLive={result.isLive}
                                                duration={result.duration}
                                                key={id}
                                            />
                                        )
                                    })
                                    :
                                        <h1>No Results</h1>
                                }
                            </div>
                        </div>
                        <div id="content">
                            <div id="header">
                                <h1>Room code: {code}</h1>
                            </div>
                            <div id="info">
                                {/* TODO: info about music being played and controls*/}
                                <audio src="" id="audio-player" controls preload='auto'></audio>
                                <button onClick={togglePlay}>{isPlaying ? "Pause" : "Play"}</button> 
                            </div>
                            <div id="playlist">
                                {playlist.map((song) => {
                                    return (<div className="song" key={song.id}>
                                        <p>{song.votes}</p>
                                        <p>{song.title}</p>
                                        <p>{song.duration}</p>
                                    </div>)
                                })}
                            </div>
                        </div>
                        <div id="rightBar">
                            <div id="userList">
                                {clients && clients.map((client) => {
                                    if (socket.id === client.id) {
                                        return (<p key={client.id}>{client.nickname + " (you)"}</p>)
                                    }
                                    else {
                                        return (<p key={client.id}>{client.nickname}</p>)
                                    }                        
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )
    }
    
}

export default withRouter(Room)