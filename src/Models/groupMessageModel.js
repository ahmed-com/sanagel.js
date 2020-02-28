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
        return User.findAll({include : [{model : subscribtions,where : {room}}]});        
    }

    static getRooms(userId){
        return subscribtions.findAll({where : {userId}})
        .then(subscribtions=> subscribtions.map(subscribtion => new GroupMessage(subscribtion.room)));        
    }
    
    static updateRecordStatus(userId,recordId,status){
        return recordSubscriber.update({relation : status},{where : {userId,recordId}});
    }

    static createRecordStatus(userId,recordId,status){
        return recordSubscriber.create({recordId ,userId,relation : status});
    }

    createRecord(record){
        const room = this.id;
        return records.create({record,room});
    }

    getRecord(recordId){
        return records.findOne({where : {recordId},include : [{model : recordSubscriber , where : {relation : 'owner'}}]});
    }

    getAllRecords(){
        return records.findAll({include : [{model : recordSubscriber ,where : {relation : 'owner'}}]});
    }

    updateRecord(record){
        return records.update(record,{where : {id : record.id}});
    }

    deleteRecord(recordId){
        return records.destroy({where : {id : recordId}});
    }
}

module.exports = GroupMessage;