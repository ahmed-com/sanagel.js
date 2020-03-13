const Sequelize = require('sequelize');
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
    const nameSpaceUsers = `${nameSpace}Users`;
    const nameSpaceUserId = `${nameSpace}UserId`;

    const IO = io.of(`/${nameSpace}`);

    const subscribtions = db.define(nameSpaceRSC,{
        room : Sequelize.STRING
    });
    const records = db.define(nameSpaceERC,{
        id : {
            type : Sequelize.INTEGER,        
            autoIncrement : true,
            allowNull: false,
            primaryKey : true
        },
        record : {
            type : Sequelize.JSON,
            allowNull : false
        },
        room : {
            type : Sequelize.STRING,
            allowNull : false
        }
    });
    const recordSubscriber = db.define(nameSpaceESC,{
        relation : Sequelize.STRING
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

    db.sync({force : true})
    .then(()=>{
        class Publisher{
            constructor(id){
                this.id = id;
            }
    
            subscribe(userId){  
                const room = this.id;              
                return subscribtions.create({room, nameSpaceUserId : userId });
            }
            
            unsubscribe(userId){      
                const room = this.id;  
                return subscribtions.destroy({where : {nameSpaceUserId : userId ,room}});
            }
    
            getSubscribers(){
                const room = this.id;
                // return User.findAll({include : [{model : subscribtions,where : {room}}]});
                const query = 'SELECT `:nameSpaceUsers`.* , `:nameSpaceRSCs`.`id` AS `subscriptionId`, `:nameSpaceRSCs`.`room` AS `room`, `:nameSpaceRSCs`.`createdAt` AS `subscriptionDate` FROM `:nameSpaceUsers` AS `:nameSpaceUsers` INNER JOIN `:nameSpaceRSCs` AS `:nameSpaceRSCs` ON `:nameSpaceUsers`.`id` = `:nameSpaceRSCs`.`:nameSpaceUserId` AND `:nameSpaceRSCs`.`room` = :room ;';
                return db.query(query,{
                    replacements :{
                        room,
                        nameSpaceERC,
                        nameSpaceERCs,
                        nameSpaceESCs,
                        nameSpaceRSCs,
                        nameSpaceUsers,
                        nameSpaceUserId
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
                return subscribtions.findAll({where : {nameSpaceUserId : userId}})
                .then(subscribtions=> subscribtions.map(subscribtion => new Publisher(subscribtion.room)));        
            }
            
            static updateRecordStatus(userId,recordId,status){
                return recordSubscriber.update({relation : status},{where : {nameSpaceUserId : userId,recordId}});
            }
    
            static createRecordStatus(userId,recordId,status){
                return recordSubscriber.create({recordId ,nameSpaceUserId : userId,relation : status});
            }
    
            createRecord(record){
                const room = this.id;
                return records.create({record,room});
            }
    
            getRecord(recordId){
                // return records.findOne({where : {id : recordId},include : [{model : recordSubscriber , where : {relation : 'owner'}}]});
                const query = 'SELECT `:nameSpaceERC`.`id`, `:nameSpaceERC`.`record`, `:nameSpaceERC`.`room`, `:nameSpaceERC`.`createdAt`, `:nameSpaceERC`.`updatedAt`, `:nameSpaceESCs`.`:nameSpaceUserId` AS `userId` FROM `:nameSpaceERCs` AS `:nameSpaceERC` INNER JOIN `:nameSpaceESCs` AS `:nameSpaceESCs` ON `:nameSpaceERC`.`id` = `:nameSpaceESCs`.`recordId` AND `:nameSpaceESCs`.`relation` = :relation WHERE `:nameSpaceERC`.`id` = :recordId;'
                return db.query(query,{
                    replacements : {
                        relation : 'owner',
                        recordId,
                        nameSpaceERC,
                        nameSpaceERCs,
                        nameSpaceESCs,
                        nameSpaceRSCs,
                        nameSpaceUserId
                    },
                    type : db.QueryTypes.SELECT
                })
            }
    
            getAllRecords(){
                const room = this.id;
                const query = 'SELECT `:nameSpaceERC`.`id`, `:nameSpaceERC`.`record`, `:nameSpaceERC`.`room`, `:nameSpaceERC`.`createdAt`, `:nameSpaceERC`.`updatedAt`, `:nameSpaceESCs`.`:nameSpaceUserId` AS `userId` FROM `:nameSpaceERCs` AS `:nameSpaceERC` INNER JOIN `:nameSpaceESCs` AS `:nameSpaceESCs` ON `:nameSpaceERC`.`id` = `:nameSpaceESCs`.`recordId` AND `:nameSpaceESCs`.`relation` = :relation WHERE `:nameSpaceERC`.`room` = :room;'
                return db.query(query,{
                    replacements : {
                        relation : 'owner',
                        room,
                        nameSpaceERC,
                        nameSpaceERCs,
                        nameSpaceESCs,
                        nameSpaceRSCs,
                        nameSpaceUserId
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
    })
}

exports.get = nameSpace => publishers[nameSpace];