const express = require('express')
const app = express()
const mongoose = require('mongoose')
const server = require('http').createServer(app)
const {
    connect
} = require('./src/db/mongoose')
const Room = require('./src/models/room')

connect()

const io = require('socket.io')(server, {
    cors: {
        origin: 'https://localhost:3000',
        methods: ["GET", "POST"]
    }
})

let rooms = []
Room.find({}).then((data) => rooms = data)


io.on('connection', socket => {
    const db = mongoose.connection
    console.log(rooms.map(room=>room.id))

    db.once("open", () => {
        const roomsStream = db.collection('rooms').watch()
        roomsStream.on("change", (change) => {

            switch (change.operationType) {
                case 'insert':
                    rooms.push(change.fullDocument)
                    io.sockets.emit(`server-sendData/rooms-not-start`, rooms)
                    io.sockets.emit(`server-sendData/rooms-starting`, rooms)
                    break
                case 'delete':
                    rooms = rooms.map(room => room._id !== change.documentKey._id)
                    io.sockets.emit(`server-sendData/rooms-not-start`, rooms)
                    io.sockets.emit(`server-sendData/rooms-starting`, rooms)
                    break
                default:
                    break
            }

            console.log(rooms.map(room=>room.id))
        })
    })


    //client get data at first time
    socket.on('client-getData', async (collection, target) => {
        switch (collection) {
            case 'rooms-not-start':
                socket.emit(`server-sendData/${collection}`,
                    rooms.filter(room => !room.isStarting))
                break
            case 'rooms-starting':
                socket.emit(`server-sendData/${collection}`,
                    rooms.filter(room => room.isStarting))
                break
            case 'room':
                console.log({rooms:rooms.map(room=>room.id),target})
                socket.emit(`server-sendData/${collection}/${target}`,
                    rooms.find(room => room.id === target))
            default:
                break
        }
    })


    socket.on("add-room", async roomInfo => {
        const room = new Room(roomInfo)
        await room.save()
        socket.emit(`server-sendData/${collection}/${target}`,
            rooms.find(room => room.id === target))
    })
})

const port = process.env.PORT || 9000
server.listen(port, () => {
    console.log('socket start')
})