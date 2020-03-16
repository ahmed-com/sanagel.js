const pool = require('../utils/db');
const io = require('../utils/socket').getIO();
const client = require('../utils/redis').getClient();

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
            return pool.execute(query,{
                nameSpaceRSCs,
                nameSpaceUserId,
                room,
                userId,
                // now : 
            });
        }
        
        unsubscribe(userId){      
            const room = this.id;  
            const query = ""
            return pool.execute(query,{

            });
        }

        getSubscribers(){
            const room = this.id;
            const query = 'SELECT `:nameSpaceUsers`.* , `:nameSpaceRSCs`.`id` AS `subscriptionId`, `:nameSpaceRSCs`.`room` AS `room`, `:nameSpaceRSCs`.`createdAt` AS `subscriptionDate` FROM `:nameSpaceUsers` AS `:nameSpaceUsers` INNER JOIN `:nameSpaceRSCs` AS `:nameSpaceRSCs` ON `:nameSpaceUsers`.`id` = `:nameSpaceRSCs`.`:nameSpaceUserId` AND `:nameSpaceRSCs`.`room` = :room ;';
            return pool.execute(query,{
                room,                
                nameSpaceRSCs,
                nameSpaceUsers,
                nameSpaceUserId                
            });
        }        

        static getUser(userId){
            const query = "";
            return pool.execute(query,{

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
            const query = "";
            return pool.execute(query,{

            })
            .then(subscribtions=> subscribtions.map(subscribtion => new Publisher(subscribtion.room)));        
        }
        
        static updateRecordStatus(userId,recordId,status){
            const query = "";
            return pool.execute(query,{

            });
        }

        static createRecordStatus(userId,recordId,status){
            const query = "";
            return pool.execute(query,{

            });
        }

        createRecord(record){
            const room = this.id;
            const query = "";
            return pool.execute(query,{

            });
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
            const query = "";
            return pool.execute(query,{

            });
        }

        deleteRecord(recordId){
            const query = "";
            return pool.execute(query,{

            });
        }
    }
    return Publisher;
}

exports.create = nameSpace => {
    pool.execute('DROP TABLE IF EXISTS `:nameSpaceUsers`;CREATE TABLE IF NOT EXISTS `:nameSpaceUsers` (`id` INTEGER NOT NULL auto_increment UNIQUE , `userName` VARCHAR(255) NOT NULL, `mail` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceRSCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceRSCs` (`id` INTEGER NOT NULL auto_increment , `room` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, `:nameSpaceUserId` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`:nameSpaceUserId`) REFERENCES `:nameSpaceUsers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceERCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceERCs` (`id` INTEGER NOT NULL auto_increment , `record` JSON NOT NULL, `room` VARCHAR(255) NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;DROP TABLE IF EXISTS `:nameSpaceESCs`;CREATE TABLE IF NOT EXISTS `:nameSpaceESCs` (`id` INTEGER NOT NULL auto_increment , `relation` VARCHAR(255), `createdAt` DATETIME NOT NULL,`updatedAt` DATETIME NOT NULL, `recordId` INTEGER, `:nameSpaceUserId` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`recordId`) REFERENCES `:nameSpaceERCs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, FOREIGN KEY (`:nameSpaceUserId`) REFERENCES `:nameSpaceUsers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;',{
        nameSpaceERCs   : `${nameSpace}ERCs`  ,
        nameSpaceESCs   : `${nameSpace}ESCs`  ,
        nameSpaceRSCs   : `${nameSpace}RSCs`  ,
        nameSpaceUserId : `${nameSpace}UserId`,
        nameSpaceUsers  : `${nameSpace}Users`
    })
    .catch(err=> console.log(err));
}