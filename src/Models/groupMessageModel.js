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
        // return User.findAll({include : [{model : subscribtions,where : {room}}]});
        const query = 'SELECT `users`.* , `groupMessageRSCs`.`id` AS `subscriptionId`, `groupMessageRSCs`.`room` AS `room`, `groupMessageRSCs`.`createdAt` AS `subscriptionDate` FROM `users` AS `users` INNER JOIN `groupMessageRSCs` AS `groupMessageRSCs` ON `users`.`id` = `groupMessageRSCs`.`userId` AND `groupMessageRSCs`.`room` = :room ;';
        return db.query(query,{
            replacements :{
                room
            },
            type : db.QueryTypes.SELECT
        });
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
        // return records.findOne({where : {id : recordId},include : [{model : recordSubscriber , where : {relation : 'owner'}}]});
        const query = 'SELECT `groupMessageERC`.`id`, `groupMessageERC`.`record`, `groupMessageERC`.`room`, `groupMessageERC`.`createdAt`, `groupMessageERC`.`updatedAt`, `groupMessageESCs`.`userId` AS `userId` FROM `groupMessageERCs` AS `groupMessageERC` INNER JOIN `groupMessageESCs` AS `groupMessageESCs` ON `groupMessageERC`.`id` = `groupMessageESCs`.`recordId` AND `groupMessageESCs`.`relation` = :relation WHERE `groupMessageERC`.`id` = :recordId;'
        return db.query(query,{
            replacements : {
                relation : 'owner',
                recordId
            },
            type : db.QueryTypes.SELECT
        })
    }

    getAllRecords(){
        const room = this.id;
        const query = 'SELECT `groupMessageERC`.`id`, `groupMessageERC`.`record`, `groupMessageERC`.`room`, `groupMessageERC`.`createdAt`, `groupMessageERC`.`updatedAt`, `groupMessageESCs`.`userId` AS `userId` FROM `groupMessageERCs` AS `groupMessageERC` INNER JOIN `groupMessageESCs` AS `groupMessageESCs` ON `groupMessageERC`.`id` = `groupMessageESCs`.`recordId` AND `groupMessageESCs`.`relation` = :relation WHERE `groupMessageERC`.`room` = :room;'
        return db.query(query,{
            replacements : {
                relation : 'owner',
                room
            },
            type : db.QueryTypes.SELECT
        })
    }

    static updateRecord(record){
        return records.update(record,{where : {id : record.id}});
    }

    static deleteRecord(recordId){
        return records.destroy({where : {id : recordId}});
    }
}

module.exports = GroupMessage;