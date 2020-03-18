const pool = require('../utils/db');
const io = require('../utils/socket').getIO();
const client = require('../utils/redis').getClient();
const moment = require('moment');

exports.get = nameSpace =>{

    const nameSpaceRRCs = `${nameSpace}RRCs`;
    const nameSpaceERCs = `${nameSpace}ERCs`;
    const nameSpaceESCs = `${nameSpace}ESCs`;    
    const nameSpaceRSCs = `${nameSpace}RSCs`;
    const nameSpaceUsers = `${nameSpace}Users`;

    const IO = io.of(`/${nameSpace}`);

    class Publisher{
        constructor(id){
            this.id = id;
        }

        subscribe(userId){  
            const room = this.id;
            const query = "INSERT INTO :nameSpaceRSCs(`room`,`createdAt`,`updatedAt`,`user`) VALUES (:room,:now,:now,:userId);"
            return pool.myExecute(query,{
                nameSpaceRSCs,
                room,
                userId,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }
        
        unsubscribe(userId){      
            const room = this.id;  
            const query = "DELETE FROM `:nameSpaceRSCs` WHERE `user` = `:userId` AND `room` = :room ;"
            return pool.myExecute(query,{
                nameSpaceRSCs,
                userId,
                room
            });
        }

        getSubscribers(){
            const room = this.id;
            const query = 'SELECT `:nameSpaceUsers`.* , `:nameSpaceRSCs`.`room` AS `room`, `:nameSpaceRSCs`.`createdAt` AS `subscriptionDate` FROM `:nameSpaceUsers` INNER JOIN `:nameSpaceRSCs` ON `:nameSpaceUsers`.`id` = `:nameSpaceRSCs`.`:user` AND `:nameSpaceRSCs`.`room` = :room ;';
            return pool.myExecute(query,{
                room,                
                nameSpaceRSCs,
                nameSpaceUsers,         
            });
        }        

        static getUser(userId){
            const query = "SELECT `id`, `userName`, `mail`, `createdAt`, `updatedAt` FROM `:nameSpaceUsers` WHERE `id` = `:userId` LIMIT 1;";
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

        static getRoomsByUser(userId){
            const query = "SELECT `:nameSpaceRRCs`.* , `:nameSpaceRSCs`.`createdAt` AS `subscriptionDate`, `:nameSpaceRSCs`.`accessLevel` AS `accessLevel` FROM :nameSpaceRRCs INNER JOIN `:nameSpaceRSCs` ON `:nameSpaceRRCs`.`id` = `:nameSpaceRSCs`.`room` AND `:nameSpaceRSCs`.`user` = `:userId` ;";
            return pool.myExecute(query,{
                nameSpaceRSC,
                nameSpaceRSCs,
                userId
            })
            .then(rooms=> rooms.map(room => new Publisher(room.id)));
        }
        
        static updateRecordStatus(userId,recordId,status){
            const query = "UPDATE `:nameSpaceESCs` SET `relation`=`:status`,`updatedAt`=`:now` WHERE `:user` = `:userId` AND `record` = `:recordId` ;";
            return pool.myExecute(query,{
                nameSpaceESCs,
                status,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                userId,
                recordId
            });
        }

        static createRecordStatus(userId,recordId,status){
            const query = "INSERT INTO `:nameSpaceESCs` (`relation`,`createdAt`,`updatedAt`,`record`,`user`) VALUES (`:status`,`:now`,`:now`,`:recordId`,`:userId`);";
            return pool.myExecute(query,{
                nameSpaceESCs,
                status,
                recordId,
                userId,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }

        createRecord(data){
            const room = this.id;
            const query = "INSERT INTO `:nameSpaceERCs` (`id`,`data`,`room`,`createdAt`,`updatedAt`) VALUES (DEFAULT,`:data`,`:room`,`:now`,`:now`);";
            return pool.myExecute(query,{
                nameSpaceERCs,
                data : JSON.stringify(data),
                room,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }

        getRecord(recordId){            
            const query = 'SELECT `:nameSpaceERCs`.`id`, `:nameSpaceERCs`.`data`, `:nameSpaceERCs`.`room`, `:nameSpaceERCs`.`createdAt`, `:nameSpaceERCs`.`updatedAt`, `:nameSpaceERCs`.`author` FROM `:nameSpaceERCs` WHERE `:nameSpaceERCs`.`id` = :recordId LIMIT 1 ;'
            return pool.myExecute(query,{
                recordId,
                nameSpaceERCs            
            })
        }

        getRecordsByRoom(){
            const room = this.id;
            const query = 'SELECT `:nameSpaceERCs`.`id`, `:nameSpaceERCs`.`data`, `:nameSpaceERCs`.`room`, `:nameSpaceERCs`.`createdAt`, `:nameSpaceERCs`.`updatedAt`, `:nameSpaceERCs`.`author` FROM `:nameSpaceERCs` WHERE `:nameSpaceERCs`.`room` = :room ;'
            return pool.myExecute(query,{
                room,
                nameSpaceERCs                
            })
        }

        updateRecord(record){
            const query = "UPDATE `:nameSpaceERCs` SET `data`=:data,`updatedAt`=:now WHERE `id` = :recordId ;";
            return pool.myExecute(query,{
                record : record.record,
                recordId : record.id
            });
        }

        deleteRecord(recordId){
            const query = "DELETE FROM `:nameSpaceERCs` WHERE `id` = :recordId;";
            return pool.myExecute(query,{
                nameSpaceERCs,
                recordId
            });
        }

        static createRoom(userId,data){
            const query = "INSERT INTO `:nameSpaceRRCs`(`id`,`parent`,`admin`,`data`,`createdAt`,`updatedAt`) VALUES (DEFAULT,`:parent`,`:userId`,`:data`,`:now`,`:now`);";
            return pool.myExecute(query,{
                nameSpaceRRCs,
                parent : null,
                userId,
                data,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }

        createRoom(userId,data){
            const room = this.id;
            const query = "INSERT INTO `:nameSpaceRRCs`(`id`,`parent`,`admin`,`data`,`createdAt`,`updatedAt`) VALUES (DEFAULT,`:parent`,`:userId`,`:data`,`:now`,`:now`);";
            return pool.myExecute(query,{
                nameSpaceRRCs,
                parent : room,
                userId,
                data,
                now : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            });
        }

        deleteRoom(){
            const room = this.id;
            const query = "DELETE FROM `:nameSpaceRRCs` WHERE `id` = :room ;";
            return pool.myExecute(query,{
                nameSpaceRRCs,
                room 
            });
        }

        updateRoom(data){
            const room = this.id;
            const query = "UPDATE `:nameSpaceRRCs` SET `data`=:data,`updatedAt`=:now WHERE `id` = :room ;";
            return pool.myExecute(query,{
                nameSpaceRRCs,
                room,
                data
            });
        }

        getData(){
            const room = this.id;
            const query = "SELECT * FROM `:nameSpaceRRCs` WHERE id = `:room`;";
            return pool.myExecute(query,{
                nameSpaceRRCs,
                room
            })
        }

        getSubscribersCount(){
            const room = this.id;
            const query = "SELECT COUNT(*) FROM `:nameSpaceRSCs` WHERE room = `:room` ;";
            return pool.myExecute(query,{
                nameSpaceRRCs,
                room
            })
        }
    }
    return Publisher;
}

exports.create = nameSpace => {
    return pool.myExecute('DROP TABLE IF EXISTS `:nameSpaceUsers`; CREATE TABLE IF NOT EXISTS `:nameSpaceUsers` (`id` INTEGER NOT NULL auto_increment UNIQUE , `userName` VARCHAR(255) NOT NULL, `mail` VARCHAR(255) UNIQUE, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceRRCs`; CREATE TABLE IF NOT EXISTS `:nameSpaceRRCs` (`id` INTEGER NOT NULL auto_increment UNIQUE , `parent` INTEGER, `data` JSON,`admin` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`admin`) REFERENCES `:nameSpaceUsers` ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceRSCs`; CREATE TABLE IF NOT EXISTS `:nameSpaceRSCs` (`room` INTEGER NOT NULL, `user` INTEGER NOT NULL, `accessLevel` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`room`,`user`), FOREIGN KEY (`room`) REFERENCES `:nameSpaceRRCs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`user`) REFERENCES `:nameSpaceUsers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceERCs`; CREATE TABLE IF NOT EXISTS `:nameSpaceERCs` (`id` INTEGER NOT NULL auto_increment UNIQUE , `data` JSON NOT NULL, `room` INTEGER NOT NULL,`author` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`room`) REFERENCES `:nameSpaceRRCs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (`author`) REFERENCES `:nameSpaceUsers` ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceESCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceESCs` (`relation` VARCHAR(255), `record` INTEGER NOT NULL, `user` INTEGER NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`record`,`user`), FOREIGN KEY (`record`) REFERENCES `:nameSpaceERCs` (`id`), FOREIGN KEY (`user`) REFERENCES `:nameSpaceUsers` (`id`)) ENGINE=InnoDB;',{
        nameSpaceERCs   : `${nameSpace}ERCs`  ,
        nameSpaceESCs   : `${nameSpace}ESCs`  ,
        nameSpaceRSCs   : `${nameSpace}RSCs`  ,
        nameSpaceUsers  : `${nameSpace}Users`
    });
}