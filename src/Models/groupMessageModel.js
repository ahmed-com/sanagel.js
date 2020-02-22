const io = require('../utils/socket').getIO();
const nsp = io.of('/groupMessage');
const Sequalize = require('sequelize');
const db = require('../utils/db');

const subscribtions = db.define('groupMessageRSC',{
    room : Sequalize.STRING,
    user : Sequalize.INTEGER
});
const records = db.define('groupMessageERC',{
    id : {
        type : Sequalize.INTEGER,        
        autoIncrement : true,
        allowNull: false,
        primaryKey : true
    },
    record : {
        type : Sequalize.JSON,
        allowNull : false
    },
    room : {
        type : Sequalize.STRING,
        allowNull : false
    }
});
const recordSubscriber = db.define('groupMessageESC',{
    recordId : {
        type : Sequalize.INTEGER        
    },
    userId : {
        type : Sequalize.INTEGER
    },
    relation : Sequalize.STRING
});

class GroupMessage{
    constructor(id){
        this.id = id;
    }

    subscribe(userId,socketId,callback){
        
        nsp.connected[socketId].join(this.id);

        //MAYBE inform all subscribers about the subscription with emit ?
        // nsp.to(this.id).emit('subscribtion',new User(userId));// be careful of what you emit

        subscribtions.insertOne({room : this.id, userId},callback);
    }

    static join(userId,socketId){
        //MAYBE inform all subscribers in every room about the online status with emit ?
        const rooms = GroupMessage.getRoomIds(userId);
        rooms.forEach(room => {
            nsp.connected[socketId].join(room);
            // nsp.to(room).emit('online',new User(userId));// be careful of what you emit
        });
    }

    // this function is only about the offline behavior
    static leave(userId,socketId){
        const rooms = GroupMessage.getRoomIds(userId);
        rooms.forEach(room => {
            nsp.connected[socketId].leave(room);
            // nsp.to(room).emit('offline',new User(userId));// be careful of what you emit
        });
    }

    unsubscribe(userId,socketId,callback){        
        nsp.connected[socketId].leave(this.id);
        subscribtions.deleteOne({room:this.id,userId},callback);
        
        //MAYBE inform all subscribers about the unsubscription with emit ?
        // nsp.to(this.id).emit('unsubscribtion',new User(userId));// be careful of what you emit
    }

    removeSubscriber(userId,callback){
        subscribtions.deleteOne({room:this.id,userId},callback);
        nsp.in(this.id).clients((err,clients)=>{
            clients.forEach(socketId=>{
                nsp.connected[socketId].leave(this.id);
                nsp.connected[socketId].emit('removed',true);
            })
        });
    }

    getSubscribers(callback){
        const subscribers = subscribtions.find({room:this.id}).toArray();
        callback(subscribers);
    }

    static getRoomIds(userId,callback){
        const rooms = subscribtions.find({userId}).toArray();
        callback(rooms);
    }

    static getRooms(userId,callback){
        const rooms = subscribtions.find({userId}).toArray().map(room => new GroupMessage(room));
        callback(rooms);
    }

    static getRecordStatus(userId,recordId,callback){
        //gets the record status from the ESC
    }

    static updateRecordStatus(userId,recordId,callback){
        //updates the record status in the ESC
    }

    static creatRecordStatus(userId,recordId,callback){
        //creates a record status in the ESC
    }

    static deleteRecordStatus(userId,recordId,callback){
        //deletes a record status in the ESC
    }

    

    createRecord(record,callback){
        //creates a record in the ERC
        //adds a status in the ESC
        //informs the subscribers about the record
    }

    getRecord(recordId,callback){
        //gets a record from the ERC 
        //updates the status in the ESC
        //maybe informs the subscribers about the change of status
    }

    getAllRecords(callback){
        //gets all records from the ERC
    }

    updateRecord(recordId,callback){
        //updates a record in the ERC and updates the status in the ESC
    }

    deleteRecord(recordId,callback){
        //deletes a record in the ERC and deletes all of the records in the ESC
    }
}

module.exports = GroupMessage;