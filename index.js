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


io.on('connection', socket => {
    const db = mongoose.connection
    let rooms = []
    Room.find({}).then((data) => rooms = data)

    db.once("open", () => {
        const roomsStream = db.collection('rooms').watch()
        roomsStream.on("change", (change) => {
            switch (change.operationType) {
                case 'insert':
                    const newRoom = change.fullDocument
                    rooms.push(newRoom)
                    io.sockets.emit(`server-sendData/rooms-not-start`, rooms)
                    io.sockets.emit(`server-sendData/rooms-starting`, rooms)
                    socket.emit(`server-sendData/room/${newRoom.id}`,newRoom)
                    break
                case 'delete':
                    rooms = rooms.filter(room => {
                        console.log(room._id.equals(change.documentKey._id))
                        return room._id.equals(change.documentKey._id)
                    })
                    io.sockets.emit(`server-sendData/rooms-not-start`, rooms)
                    io.sockets.emit(`server-sendData/rooms-starting`, rooms)
                    break
                case 'update':
                    rooms = rooms.map(room => {
                        if (room._id.equals(change.documentKey._id))
                            return {...room,...change.updateDescription.updatedFields}
                        return room
                    })
                    io.sockets.emit(`server-sendData/rooms-not-start`, rooms)
                    io.sockets.emit(`server-sendData/rooms-starting`, rooms)
                    const findRoomUpdated = rooms.find(room =>
                        room._id.equals(change.documentKey._id))
                    io.sockets.emit(`server-sendData/room/${findRoomUpdated.id}`,findRoomUpdated)
                    break
                default:
                    break
            }
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
                socket.emit(`server-sendData/${collection}/${target}`,
                    rooms.find(room => room.id === target))
            default:
                break
        }
        
    })


    socket.on("add-room", async roomInfo => {
        const room = new Room(roomInfo)
        await room.save()
    })
    socket.on("update-room", async (target, newFields) => {
        await Room.updateOne({ id: target }, newFields)
    })
    socket.on("delete-room", async target => {
        await Room.deleteOne({ id: target })
    })
})

const port = process.env.PORT || 9000
server.listen(port, () => {
    console.log('socket start')
})