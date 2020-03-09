const Sequalize = require('sequelize');
const db = require('../utils/db');
const io = require('../utils/socket').getIO();
const client = require('../utils/redis').getClient();
const publishers = {};

exports.save = nameSpace =>{

    const nameSpaceERC = `${nameSpace}ERC`;
    const nameSpaceERCs = `${nameSpace}ERCs`;
    const nameSpaceESCs = `${nameSpace}ESCs`;
    const nameSpaceESC = `${nameSpace}ESC`;
    const nameSpaceRSCs = `${nameSpace}RSCs`;
    const nameSpaceRSC = `${nameSpace}RSC`;
    const nameSpaceUsers = `${nameSpace}Users`

    const IO = io.of(`/${nameSpace}`);

    const subscribtions = db.define(nameSpaceRSC,{
        room : Sequalize.STRING
    });
    const records = db.define(nameSpaceERC,{
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
    const recordSubscriber = db.define(nameSpaceESC,{
        relation : Sequalize.STRING
    });

    const User = db.define(nameSpaceUsers,{
        id : {
            type : Sequelize.INTEGER,
            autoIncrement : true,
            allowNull : false,
            primaryKey : true,
            unique : true
        },
        userName : {
            type : Sequelize.STRING,
            allowNull : false
        },
        mail : Sequelize.STRING
    });

    User.hasMany(subscribtions);
    records.hasMany(recordSubscriber,{foreignKey: 'recordId'});
    User.hasMany(recordSubscriber);

    class Publisher{
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
            const query = 'SELECT `:nameSpaceUsers`.* , `:nameSpaceRSCs`.`id` AS `subscriptionId`, `:nameSpaceRSCs`.`room` AS `room`, `:nameSpaceRSCs`.`createdAt` AS `subscriptionDate` FROM `:nameSpaceUsers` AS `:nameSpaceUsers` INNER JOIN `:nameSpaceRSCs` AS `:nameSpaceRSCs` ON `:nameSpaceUsers`.`id` = `:nameSpaceRSCs`.`userId` AND `:nameSpaceRSCs`.`room` = :room ;';
            return db.query(query,{
                replacements :{
                    room,
                    nameSpaceERC,
                    nameSpaceERCs,
                    nameSpaceESCs,
                    nameSpaceRSCs,
                    nameSpaceUsers
                },
                type : db.QueryTypes.SELECT
            });
        }        

        static getUser(userId){
            return User.findByPk(userId);
        }

        static getSocketId = userId =>{
            return new Promise((resolve,reject)=>{
                client.hget(nameSpace,userId,(err,value)=>{
                    err ? reject(err) : resolve(value);
                });
            })
        }

        static setSocketId = (socketId,userId)=>{
            client.hset(nameSpace,userId,socketId);
        }

        emit(event,data){
            IO.to(this.id).emit(event,data);
        }

        leave(socketId){
            IO.connected[socketId].leave(this.id);
        }

        join(socketId){
            IO.connected[socketId].join(this.id);
        }

        static getRooms(userId){
            return subscribtions.findAll({where : {userId}})
            .then(subscribtions=> subscribtions.map(subscribtion => new Publisher(subscribtion.room)));        
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
            const query = 'SELECT `:nameSpaceERC`.`id`, `:nameSpaceERC`.`record`, `:nameSpaceERC`.`room`, `:nameSpaceERC`.`createdAt`, `:nameSpaceERC`.`updatedAt`, `:nameSpaceESCs`.`userId` AS `userId` FROM `:nameSpaceERCs` AS `:nameSpaceERC` INNER JOIN `:nameSpaceESCs` AS `:nameSpaceESCs` ON `:nameSpaceERC`.`id` = `:nameSpaceESCs`.`recordId` AND `:nameSpaceESCs`.`relation` = :relation WHERE `:nameSpaceERC`.`id` = :recordId;'
            return db.query(query,{
                replacements : {
                    relation : 'owner',
                    recordId,
                    nameSpaceERC,
                    nameSpaceERCs,
                    nameSpaceESCs,
                    nameSpaceRSCs
                },
                type : db.QueryTypes.SELECT
            })
        }

        getAllRecords(){
            const room = this.id;
            const query = 'SELECT `:nameSpaceERC`.`id`, `:nameSpaceERC`.`record`, `:nameSpaceERC`.`room`, `:nameSpaceERC`.`createdAt`, `:nameSpaceERC`.`updatedAt`, `:nameSpaceESCs`.`userId` AS `userId` FROM `:nameSpaceERCs` AS `:nameSpaceERC` INNER JOIN `:nameSpaceESCs` AS `:nameSpaceESCs` ON `:nameSpaceERC`.`id` = `:nameSpaceESCs`.`recordId` AND `:nameSpaceESCs`.`relation` = :relation WHERE `:nameSpaceERC`.`room` = :room;'
            return db.query(query,{
                replacements : {
                    relation : 'owner',
                    room,
                    nameSpaceERC,
                    nameSpaceERCs,
                    nameSpaceESCs,
                    nameSpaceRSCs
                },
                type : db.QueryTypes.SELECT
            })
        }

        updateRecord(record){
            return records.update(record,{where : {id : record.id}});
        }

        deleteRecord(recordId){
            return records.destroy({where : {id : recordId}});
        }
    }

    publishers[nameSpace] = Publisher;
}

exports.get = nameSpace => publishers[nameSpace];