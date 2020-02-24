const User = require('./user');
const Sequalize = require('sequelize');
const db = require('../utils/db');

const subscribtions = db.define('groupMessageRSC',{
    room : Sequalize.STRING
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
    relation : Sequalize.STRING
});

User.hasMany(subscribtions);
records.hasMany(recordSubscriber,{foreignKey: 'recordId'});
User.hasMany(recordSubscriber);

class GroupMessage{
    constructor(id){
        /**
         * consider the following later :-
         *      this = groupMessageIO.to(roomId);
         *      this.id = roomId;
         * then everthing will just work the same as it does the only difference is when you start emitting from the controller you * * * will call the emit method on the model obj.
         */
        this.id = id;
    }

    subscribe(userId,callback){  
        const room = this.id;              
        subscribtions.create({room, userId }).then(callback).catch(err=>{
            console.log(err);
        });
    }
    
    unsubscribe(userId,callback){      
        const room = this.id;  
        subscribtions.destroy({where : {userId ,room}}).then(callback).catch(err=>{
            console.log(err);
        });
    }

    getSubscribers(callback){
        const room = this.id;
        subscribtions.findAll({where : {room}}).then(subscribtions=>subscribtions.map(subscribtion => new User(subscribtion.userId)))
        .then(callback(subscribers))
        .catch(err=>{
            console.log(err);
        });
    }

    static getRooms(userId,callback){
        const rooms = subscribtions.findAll({where : {userId}})
        .then(subscribtions=> subscribtions.map(subscribtion => new GroupMessage(subscribtion.room)))
        .then(callback(rooms))
        .catch(err=>{
            console.log(err);
        });
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