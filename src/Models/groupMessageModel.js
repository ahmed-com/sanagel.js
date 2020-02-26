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

    subscribe(userId){  
        const room = this.id;              
        return subscribtions.create({room, userId });
    }
    
    unsubscribe(userId){      
        const room = this.id;  
        return subscribtions.destroy({where : {userId ,room}});
    }

    getSubscribers(){
        const room = this.id;
        return subscribtions.findAll({where : {room},include : [User]});        
    }

    static getRooms(userId){
        return subscribtions.findAll({where : {userId}})
        .then(subscribtions=> subscribtions.map(subscribtion => new GroupMessage(subscribtion.room)));        
    }

    static getRecordStatus(userId,recordId){
        //gets the record status from the ESC
    }

    static updateRecordStatus(userId,recordId,status){
        return recordSubscriber.update({relation : status},{where : {userId,recordId}});
    }

    static creatRecordStatus(userId,recordId,status){
        return recordSubscriber.create({recordId ,userId,relation : status});
    }

    static deleteRecordStatus(userId,recordId){
        //deletes a record status in the ESC
    }

    

    createRecord(userId,record,callback){
        const room = this.id;
        return records.create({record,room});
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