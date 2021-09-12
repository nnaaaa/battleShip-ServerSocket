const mongoose = require('mongoose')
const Room = mongoose.Schema({
    id: String,
    size: Number,
    limits: Number,
    shipsPos: String,
    isStarting: Boolean,
    player1: {
        type: {
            id: String,
            name: String,
            avatar: String
        },
        default:{}
    },
    player2: {
        type: {
            id: String,
            name:String,
            avatar:String
        },
        default:{}
    },
    ships1: Array,
    ships2: Array,
    sensors1: Array,
    sensors2: Array,
    userReady: Array,
    arranged: Array,
    spectators: Array,
    message: {
        type: {
            avatar: String,
            name: String,
            message:String
        },
        default:{}
    },
    turn: String
}, {
    versionKey:false
})

module.exports = mongoose.model('Room',Room)