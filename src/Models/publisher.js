const pool = require('../utils/db');
const io = require('../utils/socket').getIO();
const client = require('../utils/redis').getClient();
const moment = require('moment');

exports.get = nameSpace =>{

    const nameSpaceERC = `${nameSpace}ERC`;
    const nameSpaceERCs = `${nameSpace}ERCs`;
    const nameSpaceESCs = `${nameSpace}ESCs`;
    const nameSpaceESC = `${nameSpace}ESC`;
    const nameSpaceRSCs = `${nameSpace}RSCs`;
    const nameSpaceRSC = `${nameSpace}RSC`;
    const nameSpaceUsers = `${nameSpace}Users`;
    const nameSpaceUserId = `${nameSpace}UserId`;

    const IO = io.of(`/${nameSpace}`);

    class Publisher{
        constructor(id){
            this.id = id;
        }

        subscribe(userId){  
            const room = this.id;
            const query = "INSERT INTO :nameSpaceRSCs (`id`,`room`,`createdAt`,`updatedAt`,:nameSpaceUserId) VALUES (DEFAULT,:room,:now,:now,:userId);"             
            return pool.myExecute(query,{
                nameSpaceRSCs,
                nameSpaceUserId,
                room,
                userId,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }
        
        unsubscribe(userId){      
            const room = this.id;  
            const query = "DELETE FROM `:nameSpaceRSCs` WHERE `:nameSpaceUserId` = :userId AND `room` = :room"
            return pool.myExecute(query,{
                nameSpaceRSCs,
                nameSpaceUserId,
                userId,
                room
            });
        }

        getSubscribers(){
            const room = this.id;
            const query = 'SELECT `:nameSpaceUsers`.* , `:nameSpaceRSCs`.`id` AS `subscriptionId`, `:nameSpaceRSCs`.`room` AS `room`, `:nameSpaceRSCs`.`createdAt` AS `subscriptionDate` FROM `:nameSpaceUsers` AS `:nameSpaceUsers` INNER JOIN `:nameSpaceRSCs` AS `:nameSpaceRSCs` ON `:nameSpaceUsers`.`id` = `:nameSpaceRSCs`.`:nameSpaceUserId` AND `:nameSpaceRSCs`.`room` = :room ;';
            return pool.myExecute(query,{
                room,                
                nameSpaceRSCs,
                nameSpaceUsers,
                nameSpaceUserId                
            });
        }        

        static getUser(userId){
            const query = "SELECT `id`, `userName`, `mail`, `createdAt`, `updatedAt` FROM `:nameSpaceUsers` AS `users` WHERE `users`.`id` = :userId;";
            return pool.myExecute(query,{
                nameSpaceUsers,
                userId
            });
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
            const query = "SELECT `id`, `room`, `createdAt`, `updatedAt`, :nameSpaceUserId FROM :nameSpaceRSCs AS :nameSpaceRSC WHERE :nameSpaceRSC.:nameSpaceUserId = :userId;";
            return pool.myExecute(query,{
                nameSpaceUserId,
                nameSpaceRSC,
                nameSpaceRSCs,
                userId
            })
            .then(subscribtions=> subscribtions.map(subscribtion => new Publisher(subscribtion.room)));        
        }
        
        static updateRecordStatus(userId,recordId,status){
            const query = "UPDATE `:nameSpaceESCs` SET `relation`=:status,`updatedAt`=:now WHERE `:nameSpaceUserId` = :userId AND `recordId` = :recordId";
            return pool.myExecute(query,{
                nameSpaceESCs,
                status,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                nameSpaceUserId,
                userId,
                recordId
            });
        }

        static createRecordStatus(userId,recordId,status){
            const query = "INSERT INTO `:nameSpaceESCs` (`id`,`relation`,`createdAt`,`updatedAt`,`recordId`,`:nameSpaceUserId`) VALUES (DEFAULT,:status,:now,:now,:recordId,:userId);";
            return pool.myExecute(query,{
                nameSpaceESCs,
                nameSpaceUserId,
                status,
                recordId,
                userId,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }

        createRecord(record){
            const room = this.id;
            const query = "INSERT INTO `:nameSpaceERCs` (`id`,`record`,`room`,`createdAt`,`updatedAt`) VALUES (DEFAULT,:record,:room,:now,:now);";
            return pool.myExecute(query,{
                nameSpaceERCs,
                record : JSON.stringify(record),
                room,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }

        getRecord(recordId){            
            const query = 'SELECT `:nameSpaceERC`.`id`, `:nameSpaceERC`.`record`, `:nameSpaceERC`.`room`, `:nameSpaceERC`.`createdAt`, `:nameSpaceERC`.`updatedAt`, `:nameSpaceESCs`.`:nameSpaceUserId` AS `userId` FROM `:nameSpaceERCs` AS `:nameSpaceERC` INNER JOIN `:nameSpaceESCs` AS `:nameSpaceESCs` ON `:nameSpaceERC`.`id` = `:nameSpaceESCs`.`recordId` AND `:nameSpaceESCs`.`relation` = :relation WHERE `:nameSpaceERC`.`id` = :recordId;'
            return pool.myExecute(query,{
                relation : 'owner',
                recordId,
                nameSpaceERC,
                nameSpaceERCs,
                nameSpaceESCs,
                nameSpaceUserId            
            })
        }

        getAllRecords(){
            const room = this.id;
            const query = 'SELECT `:nameSpaceERC`.`id`, `:nameSpaceERC`.`record`, `:nameSpaceERC`.`room`, `:nameSpaceERC`.`createdAt`, `:nameSpaceERC`.`updatedAt`, `:nameSpaceESCs`.`:nameSpaceUserId` AS `userId` FROM `:nameSpaceERCs` AS `:nameSpaceERC` INNER JOIN `:nameSpaceESCs` AS `:nameSpaceESCs` ON `:nameSpaceERC`.`id` = `:nameSpaceESCs`.`recordId` AND `:nameSpaceESCs`.`relation` = :relation WHERE `:nameSpaceERC`.`room` = :room;'
            return pool.myExecute(query,{
                relation : 'owner',
                room,
                nameSpaceERC,
                nameSpaceERCs,
                nameSpaceESCs,
                nameSpaceUserId                
            })
        }

        updateRecord(record){
            const query = "UPDATE `:nameSpaceERCs` SET `record`=:record,`updatedAt`=:now WHERE `recordId` = :recordId";
            return pool.myExecute(query,{
                record : record.record,
                recordId : record.id
            });
        }

        deleteRecord(recordId){
            const query = "DELETE FROM `:nameSpaceERCs` WHERE `id` = :recordId";
            return pool.myExecute(query,{
                nameSpaceERCs,
                recordId
            });
        }
    }
    return Publisher;
}

exports.create = nameSpace => {
    return pool.myExecute('DROP TABLE IF EXISTS `:nameSpaceUsers`;CREATE TABLE IF NOT EXISTS `:nameSpaceUsers` (`id` INTEGER NOT NULL auto_increment UNIQUE , `userName` VARCHAR(255) NOT NULL, `mail` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceRSCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceRSCs` (`id` INTEGER NOT NULL auto_increment , `room` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `:nameSpaceUserId` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`:nameSpaceUserId`) REFERENCES `:nameSpaceUsers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceERCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceERCs` (`id` INTEGER NOT NULL auto_increment , `record` JSON NOT NULL, `room` VARCHAR(255) NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceESCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceESCs` (`id` INTEGER NOT NULL auto_increment , `relation` VARCHAR(255), `createdAt` DATETIME NOT NULL,`updatedAt` DATETIME NOT NULL, `recordId` INTEGER, `:nameSpaceUserId` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`recordId`) REFERENCES `:nameSpaceERCs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, FOREIGN KEY (`:nameSpaceUserId`) REFERENCES `:nameSpaceUsers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;CREATE UNIQUE INDEX dummy ON :nameSpaceESCs(recordId,:nameSpaceUserId , relation);CREATE UNIQUE INDEX anotherDummy ON :nameSpaceRSCs(room,:nameSpaceUserId);',{
        nameSpaceERCs   : `${nameSpace}ERCs`  ,
        nameSpaceESCs   : `${nameSpace}ESCs`  ,
        nameSpaceRSCs   : `${nameSpace}RSCs`  ,
        nameSpaceUserId : `${nameSpace}UserId`,
        nameSpaceUsers  : `${nameSpace}Users`
    });
}