const mongoose = require('mongoose')
async function connect() {
    try {
        await mongoose.connect('mongodb+srv://battleship:123tumodi@cluster0.z53no.mongodb.net/BattleShip?retryWrites=true&w=majority' ,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log("connect mongoDB successfully")
    } catch(e) {
        console.log("connect to mongoDB fail because ->",e)
    }
}

module.exports = {
    connect
}