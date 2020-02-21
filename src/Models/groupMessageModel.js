const io = require('../utils/socket').getIO();
const nsp = io.of('/groupMessage');
const db = require('../utils/db').getDb();
// const User = require('./user');

const roomSubscriber = db.collection('groupMessageRSC');
const recordRoom = db.collection('groupMessageERC');
const recordSubscriber = db.collection('groupMessageESC');

class GroupMessage{
    constructor(id){//the id represents the room
        this.id = id;
    }

    subscribe(userId,socketId,callback){
        //gets the socket to join this room
        nsp.connected[socketId].join(this.id);

        //MAYBE inform all subscribers about the subscription with emit ?
        // nsp.to(this.id).emit('subscribtion',new User(userId));// be careful of what you emit

        //adds the userId and the room id "this.id" to the RSC
        roomSubscriber.insertOne({room : this.id, userId},callback);
    }

    static join(userId,socketId){
        //loops through all the rooms the user subscribed to and joins them
        //MAYBE inform all subscribers in every room about the online status with emit ?
        const rooms = GroupMessage.getRoomIds(userId);
        rooms.forEach(room => {
            nsp.connected[socketId].join(room);
            // nsp.to(room).emit('online',new User(userId));// be careful of what you emit
        });
    }

    // this function is only about the offline behavior
    // static leave(userId,socketId){
    //     const rooms = GroupMessage.getRoomIds(userId);
    //     rooms.forEach(room => {
    //         nsp.connected[socketId].leave(room);
    //         // nsp.to(room).emit('offline',new User(userId));// be careful of what you emit
    //     });
    // }

    unsubscribe(userId,socketId,callback){
        //gets the socket to leave this room
        nsp.connected[socketId].leave(this.id);
        //removes the userId from the RSC 
        roomSubscriber.deleteOne({room:this.id,userId},callback);
        
        //MAYBE inform all subscribers about the unsubscription with emit ?
        // nsp.to(this.id).emit('unsubscribtion',new User(userId));// be careful of what you emit
    }

    //this is different from unsubscribe, this is force remove. so that I don't assume the subscribers sends its socketId.
    removeSubscriber(userId,callback){
        //removes the userId from the RSC
        roomSubscriber.deleteOne({room:this.id,userId},callback);
        //disconnect from all subscribers of this room and inform the client to attemp a reconnect
    }

    getSubscribers(callback){
        //gets all users ids from the RSC
        const subscribers = roomSubscriber.find({room:this.id}).toArray();
        callback(subscribers);
    }

    // this function is like getRooms but for internal use is for internal use
    static getRoomIds(userId,callback){
        const rooms = roomSubscriber.find({userId}).toArray();
        callback(rooms);
    }

    static getRooms(userId,callback){
        //gets all rooms from the RSC
        const rooms = roomSubscriber.find({userId}).toArray().map(room => new GroupMessage(room));
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