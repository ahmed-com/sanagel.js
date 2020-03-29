const pool = require(`../utils/db`);
const io = require(`../utils/socket`).getIO();
const client = require(`../utils/redis`).getClient();
const moment = require(`moment`);

exports.get = nameSpace =>{

    const nameSpaceRRCs = `T${nameSpace}RRCs`;
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceESCs = `T${nameSpace}ESCs`;
    const nameSpaceRSCs = `T${nameSpace}RSCs`;
    const nameSpaceUsers = `T${nameSpace}Users`;

    const IO = io.of(`/${nameSpace}`);

    class Publisher{
        constructor(id){
            this.id = id;
        }

        subscribe(userId,accessLevel){  
            const room = this.id;
            const query = `INSERT IGNORE INTO ${nameSpaceRSCs}(room,accessLevel,createdAt,updatedAt,user) VALUES (:room,:accessLevel,:now,:now,:userId);`
            return pool.recordWrite(nameSpace,room,query,{
                accessLevel,
                room,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        forceSubscribe(userId,accessLevel){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceRSCs}(room,accessLevel,createdAt,updatedAt,user) VALUES (:room,:accessLevel,:now,:now,:userId) ON DUPLICATE KEY UPDATE accessLevel = :accessLevel ;`;
            return pool.recordWrite(nameSpace,room,query,{
                accessLevel,
                room,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }
        
        unsubscribe(userId){      
            const room = this.id;  
            const query = `DELETE FROM ${nameSpaceRSCs} WHERE user = :userId AND room = :room ;`
            return pool.recordWrite(nameSpace,room,query,{
                userId,
                room
            });
        }

        getSubscribers(){
            const room = this.id;
            const query = `SELECT ${nameSpaceUsers}.* , ${nameSpaceRSCs}.room AS room, ${nameSpaceRSCs}.createdAt AS subscriptionDate FROM ${nameSpaceUsers} INNER JOIN ${nameSpaceRSCs} ON ${nameSpaceUsers}.id = ${nameSpaceRSCs}.user AND ${nameSpaceRSCs}.room = :room ;`;
            return pool.recordRead(nameSpace,room,query,{
                room
            });
        }        

        static getUserPublic(userId){
            const query = `SELECT id, userName FROM ${nameSpaceUsers} WHERE id = :userId LIMIT 1;`;
            return pool.myExecute(query,{
                userId
            }).then(result=>result[0]);
        }

        static getUserByMail(mail){
            const query = `SELECT id, hashedPW , userName, mail, createdAt, updatedAt FROM ${nameSpaceUsers} WHERE mail = :mail LIMIT 1;`;
            return pool.myExecute(query,{
                mail
            }).then(result=>result[0]);
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

        static removeSocketId(userId){
            client.hdel(nameSpace,userId);
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

        static isValidSocketId(socketId){
            return Object.keys(IO.connected).includes(socketId);
        }

        static getRoomsByUser(userId){
            const query = `SELECT ${nameSpaceRRCs}.* , ${nameSpaceRSCs}.createdAt AS subscriptionDate, ${nameSpaceRSCs}.accessLevel AS accessLevel FROM ${nameSpaceRRCs} INNER JOIN ${nameSpaceRSCs} ON ${nameSpaceRRCs}.id = ${nameSpaceRSCs}.room AND ${nameSpaceRSCs}.user = :userId ;`;
            return pool.myExecute(query,{
                userId
            })
            .then(rooms=> rooms.map(room => new Publisher(room.id)));
        }

        getAccessLevel(userId){
            const room = this.id;
            const query = `SELECT accessLevel FROM ${nameSpaceRSCs} WHERE room = :room AND user = :userId LIMIT 1;`;
            return pool.recordRead(nameSpace,room,query,{
                room,
                userId
            }).then(result=>result[0].accessLevel);
        }

        isSubscriber(userId){
            const room = this.id;
            const query = `SELECT EXISTS( SELECT accessLevel FROM ${nameSpaceRSCs} WHERE room = :room AND user = :userId LIMIT 1 )`;
            return pool.recordRead(nameSpace,room,query,{
                room,userId
            }).then(result => Object.values(result[0])[0]);
        }

        upsertRecordStatus(userId,recordId,status){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceESCs} (relation,createdAt,updatedAt,record,user) VALUES (:status,:now,:now,:recordId,:userId) ON DUPLICATE KEY UPDATE relation = :status , updatedAt = :now ;`;
            return pool.recordWrite(nameSpace,room,query,{
                status,
                recordId,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        getRecordStatus(recordId,userId){
            const room = this.id;
            const query = `SELECT relation FROM ${nameSpaceESCs} WHERE record = :recordId AND user = :userId LIMIT 1 ;`;
            return pool.recordRead(nameSpace,room,query,{
                recordId,
                userId
            }).then(result=>result[0].relation);
        }

        createRecord(data,userId){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceERCs} (id,data,room,author,createdAt,updatedAt) VALUES (DEFAULT,:data,:room,:userId,:now,:now);`;
            return pool.recordWrite(nameSpace,room,query,{
                data : JSON.stringify(data),
                room,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        getRecord(recordId){
            const room = this.id;
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.room, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author FROM ${nameSpaceERCs} WHERE ${nameSpaceERCs}.id = :recordId LIMIT 1 ;`
            return pool.recordRead(nameSpace,room,query,{
                recordId
            }).then(result=>result[0]);
        }

        getRecordsByRoom(){
            const room = this.id;
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.room, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author FROM ${nameSpaceERCs} WHERE ${nameSpaceERCs}.room = :room ;`
            return pool.recordRead(nameSpace,room,query,{
                room
            })
        }

        static getRecordsByUser(userId,relation){
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.room, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author, ${nameSpaceESCs}.user AS userId FROM ${nameSpaceERCs} INNER JOIN ${nameSpaceESCs} ON ${nameSpaceERCs}.id = ${nameSpaceESCs}.record AND ${nameSpaceESCs}.relation = :relation WHERE ${nameSpaceESCs}.user = :userId`;
            return pool.myExecute(query,{
                userId,
                relation
            });
        }

        updateRecord(recordId,data){
            const room = this.id;
            const query = `UPDATE ${nameSpaceERCs} SET data=:data,updatedAt=:now WHERE id = :recordId ;`;
            return pool.recordWrite(nameSpace,room,query,{
                data ,
                recordId,
                now :  moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        deleteRecord(recordId){
            const room = this.id;
            const query = `DELETE FROM ${nameSpaceERCs} WHERE id = :recordId;`;
            return pool.recordWrite(nameSpace,room,query,{
                recordId
            });
        }

        static createRoom(userId,data){
            const query = `INSERT INTO ${nameSpaceRRCs}(id,parent,admin,data,createdAt,updatedAt) VALUES (DEFAULT,:parent,:userId,:data,:now,:now);`;
            return pool.myExecute(query,{
                parent : null,
                userId,
                data,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        createNestedRoom(userId,data){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceRRCs}(id,parent,admin,data,createdAt,updatedAt) VALUES (DEFAULT,:parent,:userId,:data,:now,:now);`;
            return pool.recordWrite(nameSpace,room,query,{
                parent : room,
                userId,
                data : JSON.stringify(data),
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        deleteRoom(){
            const room = this.id;
            const query = `DELETE FROM ${nameSpaceRRCs} WHERE id = :room LIMIT 1;`;
            return pool.recordWrite(nameSpace,room,query,{
                room 
            });
        }

        updateRoom(data){
            const room = this.id;
            const query = `UPDATE ${nameSpaceRRCs} SET data=:data,updatedAt=:now WHERE id = :room ;`;
            return pool.recordWrite(nameSpace,room,query,{
                room,
                data,
                now :  moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        getData(){
            const room = this.id;
            const query = `SELECT * FROM ${nameSpaceRRCs} WHERE id = :room LIMIT 1;`;
            return pool.recordRead(nameSpace,room,query,{
                room
            }).then(result=>result[0]);
        }

        exists(){
            const room = this.id;
            const query = `SELECT EXISTS( SELECT id FROM ${nameSpaceRRCs} WHERE id = :room LIMIT 1 )`;
            return pool.recordRead(nameSpace,room,query,{
                room
            }).then(result => Object.values(result[0])[0]);
        }

        getSubscribersCount(){
            const room = this.id;
            const query = `SELECT COUNT(*) FROM ${nameSpaceRSCs} WHERE room = :room ;`;
            return pool.recordRead(nameSpace,room,query,{
                room
            })
        }

        static createUser(userName,mail,hashedPW,data){
            const query = `INSERT INTO ${nameSpaceUsers}(id, mail, hashedPW , userName, createdAt, updatedAt,data) VALUES (DEFAULT, :mail, :hashedPW ,:userName, :now,:now,:data); `;
            return pool.myExecute(query,{
                userName,
                mail,
                hashedPW,
                data,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        
    }
    return Publisher;
}

exports.create = nameSpace => {
    const nameSpaceRRCs = `T${nameSpace}RRCs`;
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceESCs = `T${nameSpace}ESCs`;
    const nameSpaceRSCs = `T${nameSpace}RSCs`;
    const nameSpaceUsers = `T${nameSpace}Users`;
    return pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceUsers} (id INTEGER NOT NULL auto_increment UNIQUE ,data JSON, userName VARCHAR(255) NOT NULL, hashedPW VARCHAR(255) NOT NULL, mail VARCHAR(255) NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (id), UNIQUE(mail)) ENGINE=InnoDB;`)
    .then(()=> pool.myExecute(` CREATE TABLE IF NOT EXISTS ${nameSpaceRRCs} (id INTEGER NOT NULL auto_increment UNIQUE , parent INTEGER NULL, data JSON,admin INTEGER NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (id), FOREIGN KEY (admin) REFERENCES ${nameSpaceUsers}(id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (parent) REFERENCES ${nameSpaceRRCs}(id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceRSCs} (room INTEGER NOT NULL, user INTEGER NOT NULL, accessLevel TINYINT, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (room,user), FOREIGN KEY (room) REFERENCES ${nameSpaceRRCs}(id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user) REFERENCES ${nameSpaceUsers} (id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceERCs} (id INTEGER NOT NULL auto_increment UNIQUE , data JSON NOT NULL, room INTEGER NOT NULL,author INTEGER NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (id), FOREIGN KEY (room) REFERENCES ${nameSpaceRRCs} (id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (author) REFERENCES ${nameSpaceUsers}(id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceESCs} (relation TINYINT, record INTEGER NOT NULL, user INTEGER NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (record,user), FOREIGN KEY (record) REFERENCES ${nameSpaceERCs} (id), FOREIGN KEY (user) REFERENCES ${nameSpaceUsers} (id)) ENGINE=InnoDB;`));
}

exports.drop = nameSpace=>{
    const nameSpaceRRCs = `T${nameSpace}RRCs`;
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceESCs = `T${nameSpace}ESCs`;
    const nameSpaceRSCs = `T${nameSpace}RSCs`;
    const nameSpaceUsers = `T${nameSpace}Users`;
    return pool.myExecute(`DROP TABLE ${nameSpaceUsers}, ${nameSpaceRSCs}, ${nameSpaceRRCs}, ${nameSpaceESCs}, ${nameSpaceERCs};`)
}