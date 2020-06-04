const pool = require(`../utils/db`);
const io = require(`../utils/socket`).getIO();
const client = require(`../utils/redis`).getClient();
const moment = require(`moment`);
const IOStore = require('../temp/nameSpaces.json');

const fs = require('fs');
const path = require('path');

const IOs = {};

(function initializeIOs(){
    IOStore.forEach(record=>{
        IOs[record.nameSpace] = io.of(`/${record.nameSpace}`);
    });
})();

exports.get = nameSpace =>{

    const nameSpaceRRCs = `T${nameSpace}RRCs`;
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceESCs = `T${nameSpace}ESCs`;
    const nameSpaceRSCs = `T${nameSpace}RSCs`;
    const nameSpaceUsers = `T${nameSpace}Users`;
    const nameSpaceRESCs = `T${nameSpace}RESCs`;

    const IO = IOs[nameSpace];

    class Publisher{
        constructor(id){
            this.id = id;
        }

        static getName(){
            return nameSpace;
        }

        subscribe(userId,accessLevel){
            const room = this.id;
            const query = `INSERT IGNORE INTO ${nameSpaceRSCs}(room,accessLevel,createdAt,updatedAt,user) VALUES (:room,:accessLevel,:now,:now,:userId);`
            return pool.roomWrite(nameSpace,room,query,{
                accessLevel,
                room,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        forceSubscribe(userId,accessLevel){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceRSCs}(room,accessLevel,createdAt,updatedAt,user) VALUES (:room,:accessLevel,:now,:now,:userId) ON DUPLICATE KEY UPDATE accessLevel = :accessLevel ;`;
            return pool.roomWrite(nameSpace,room,query,{
                accessLevel,
                room,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }
        
        unsubscribe(userId){      
            const room = this.id;  
            const query = `DELETE FROM ${nameSpaceRSCs} WHERE user = :userId AND room = :room ;`
            return pool.roomWrite(nameSpace,room,query,{
                userId,
                room
            });
        }

        getSubscribers(){// should contain public info
            const room = this.id;
            const query = `SELECT ${nameSpaceUsers}.id, ${nameSpaceUsers}.userName, ${nameSpaceRSCs}.room AS room, ${nameSpaceRSCs}.createdAt AS subscriptionDate FROM ${nameSpaceUsers} INNER JOIN ${nameSpaceRSCs} ON ${nameSpaceUsers}.id = ${nameSpaceRSCs}.user AND ${nameSpaceRSCs}.room = :room ;`;
            return pool.roomRead(nameSpace,room,query,{
                room
            });
        }        

        static getUserPublic(userId){// should contain public info
            const query = `SELECT id, userName FROM ${nameSpaceUsers} WHERE id = :userId LIMIT 1;`;
            return pool.userRead(nameSpace,userId,query,{
                userId
            })
            .then(result=>result[0]);
        }

        static getUserByMail(mail){
            const query = `SELECT id, hashedPW, data, userName, mail, createdAt, updatedAt FROM ${nameSpaceUsers} WHERE mail = :mail LIMIT 1;`;
            return pool.myExecute(query,{
                mail
            })
            .then(result=>result[0]);
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

        clearCache(){
            const room = this.id;
            setImmediate(()=>{
                const key = JSON.stringify({nameSpace,room});
                client.exists(key,bool=>{
                    if (bool) del(key);
                })
            });
        }

        static clearCache(userId){
            setImmediate(()=>{
                const key = JSON.stringify({nameSpace,userId});
                client.del(key);
            })
        }

        static isValidSocketId(socketId){
            return Object.keys(IO.connected).includes(socketId);// this defenitly needs some improvement.
        }

        static getRoomsByUser(userId){// might be a bit misleading
            const query = `SELECT ${nameSpaceRRCs}.* , ${nameSpaceRSCs}.createdAt AS subscriptionDate, ${nameSpaceRSCs}.accessLevel AS accessLevel FROM ${nameSpaceRRCs} INNER JOIN ${nameSpaceRSCs} ON ${nameSpaceRRCs}.id = ${nameSpaceRSCs}.room AND ${nameSpaceRSCs}.user = :userId ;`;
            return pool.myExecute(query,{
                userId
            })
            .then(rooms=> rooms.map(room => new Publisher(room.id)));
        }

        static getRoomsByRecord(recordId){
            const query = `SELECT DISTINCT ${nameSpaceRESCs}.room AS id FROM ${nameSpaceRESCs} WHERE ${nameSpaceRESCs}.record = :recordId;`;
            return pool.myExecute(query,{
                recordId
            })
            .then(rooms=> rooms.map(room => new Publisher(room.id)));
        }

        static getRecordRelationCount(recordId,status){
            const query = `SELECT COUNT(*) AS counter FROM ${nameSpaceESCs} WHERE record = :recordId AND relation = :status;`;
            return pool.myExecute(query,{
                recordId,
                relation,
                status
            })
            .then(result => Object.values(result[0])[0]);
        }

        getAccessLevel(userId){
            const room = this.id;
            const query = `SELECT accessLevel FROM ${nameSpaceRSCs} WHERE room = :room AND user = :userId LIMIT 1;`;
            return pool.roomRead(nameSpace,room,query,{
                room,
                userId
            })
            .then(result=>{
                return result[0] ? result[0].accessLevel : false;
            })
        }

        isSubscriber(userId){
            const room = this.id;
            const query = `SELECT EXISTS( SELECT accessLevel FROM ${nameSpaceRSCs} WHERE room = :room AND user = :userId LIMIT 1 )`;
            return pool.roomRead(nameSpace,room,query,{
                room,userId
            }).then(result => Object.values(result[0])[0]);
        }

        static upsertRecordStatus(userId,recordId,status){
            const query = `INSERT INTO ${nameSpaceESCs} (relation,createdAt,updatedAt,record,user) VALUES (:status,:now,:now,:recordId,:userId) ON DUPLICATE KEY UPDATE relation = :status , updatedAt = :now ;`;
            return pool.myExecute(query,{
                status,
                recordId,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        getRecordStatus(recordId,userId){
            const room = this.id;
            const query = `SELECT relation FROM ${nameSpaceESCs} WHERE record = :recordId AND user = :userId LIMIT 1 ;`;
            return pool.roomRead(nameSpace,room,query,{
                recordId,
                userId
            })
            .then(result=>{
                return result[0] ? result[0].relation : false;
            });
        }

        createRecord(data,userId){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceERCs} (id,data,author,createdAt,updatedAt) VALUES (DEFAULT,:data,:userId,:now,:now);`;
            return pool.roomWrite(nameSpace,room,query,{
                data : JSON.stringify(data),
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        addReference(recordId,userId){
            Publisher.clearCache(userId);
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceRESCs} (room,record,user,insertedAt) VALUES (:room,:recordId,:userId,:now);`;
            return pool.roomWrite(nameSpace,room,query,{
                room,
                recordId,
                userId,
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            })
        }

        isHost(recordId,userId){
            const room = this.id;
            const query = `SELECT EXISTS( SELECT record FROM ${nameSpaceRESCs} WHERE room = :room AND record = :recordId AND user = :userId LIMIT 1 );`;
            return pool.roomRead(nameSpace,room,query,{
                room,
                recordId,
                userId
            }).then(result => Object.values(result[0])[0]);
        }

        createRecordWithReference(data,userId){
            let recordId;
            return pool.promise().query('START TRANSACTION')
            .then(()=>this.createRecord(data,userId))
            .then(({insertId})=>{
                recordId = insertId;
                return this.addReference(recordId,userId);
            })
            .then(()=> pool.promise().query('COMMIT'))
            .then(()=>recordId);
        }

        removeReference(recordId,userId){
            Publisher.clearCache(userId);
            const room = this.id;
            const query = `DELETE FROM ${nameSpaceRESCs} where room = :room AND user = :userId AND record = :recordId ;`;
            return pool.roomWrite(nameSpace,room,query,{
                room,
                recordId,
                userId
            })
        }

        changeReference(recordId,userId,roomId){
            Publisher.clearCache(userId);
            const room = this.id;
            const query = `UPDATE ${nameSpaceRESCs} SET room = :roomId, insertedAt= :now WHERE record = :recordId AND user = :userId AND room = :room`;
            return pool.roomWrite(nameSpace,room,query,{
                recordId,
                userId,
                room,
                roomId
            })
        }

        getRecord(recordId){
            const room = this.id;
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author, ${nameSpaceRESCs}.room AS room FROM ${nameSpaceERCs} INNER JOIN ${nameSpaceRESCs} ON ${nameSpaceERCs}.id = ${nameSpaceRESCs}.record WHERE ${nameSpaceRESCs}.room = :room AND ${nameSpaceERCs}.id = :recordId LIMIT 1 ;`
            return pool.roomRead(nameSpace,room,query,{
                room,
                recordId
            })
            .then(result=>result[0]);
        }

        getRecordsByRoom(){
            const room = this.id;
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author, ${nameSpaceRESCs}.room, ${nameSpaceRESCs}.user AS host, ${nameSpaceRESCs}.insertedAt FROM ${nameSpaceERCs} INNER JOIN ${nameSpaceRESCs} ON ${nameSpaceERCs}.id = ${nameSpaceRESCs}.record WHERE ${nameSpaceRESCs}.room = :room ;`
            return pool.roomRead(nameSpace,room,query,{
                room
            })
        }

        static getRecordsByUserRelation(userId,relation){
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author, ${nameSpaceESCs}.user AS userId FROM ${nameSpaceERCs} INNER JOIN ${nameSpaceESCs} ON ${nameSpaceERCs}.id = ${nameSpaceESCs}.record AND ${nameSpaceESCs}.relation = :relation WHERE ${nameSpaceESCs}.user = :userId`;
            return pool.myExecute(nameSpace,userId,query,{
                userId,
                relation
            });
        }

        static getRecordsByAuthor(userId){
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author WHERE ${nameSpaceERCs}.author = :userId ;`;
            return pool.userRead(nameSpace,userId,query,{
                userId
            });
        }

        static getRecordsByUser(userId){
            const query = `SELECT ${nameSpaceERCs}.id, ${nameSpaceERCs}.data, ${nameSpaceERCs}.createdAt, ${nameSpaceERCs}.updatedAt, ${nameSpaceERCs}.author, ${nameSpaceRESCs}.user AS userId, ${nameSpaceRESCs}.room, ${nameSpaceRESCs}.insertedAt FROM ${nameSpaceERCs} INNER JOIN ${nameSpaceRESCs} ON ${nameSpaceERCs}.id = ${nameSpaceRESCs}.record AND ${nameSpaceRESCs}.user = :userId ;`;
            return pool.userRead(nameSpace,userId,query,{
                userId
            });
        }

        updateRecord(recordId,data){
            const room = this.id;
            const query = `UPDATE ${nameSpaceERCs} SET data=:data,updatedAt=:now WHERE id = :recordId ;`;
            return pool.roomWrite(nameSpace,room,query,{
                data ,
                recordId,
                now :  moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        deleteRecord(recordId){
            const room = this.id;
            const query = `DELETE FROM ${nameSpaceERCs} WHERE id = :recordId;`;
            return pool.roomWrite(nameSpace,room,query,{
                recordId
            });
        }

        static createRoom(userId,data){
            const query = `INSERT INTO ${nameSpaceRRCs}(id,parent,admin,data,createdAt,updatedAt) VALUES (DEFAULT,:parent,:userId,:data,:now,:now);`;
            return pool.myExecute(query,{
                parent : null,
                userId,
                data : JSON.stringify(data),
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            })
            .then(({insertId})=>insertId);
        }

        createNestedRoom(userId,data){
            const room = this.id;
            const query = `INSERT INTO ${nameSpaceRRCs}(id,parent,admin,data,createdAt,updatedAt) VALUES (DEFAULT,:parent,:userId,:data,:now,:now);`;
            return pool.roomWrite(nameSpace,room,query,{
                parent : room,
                userId,
                data : JSON.stringify(data),
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            })
            .then(({insertId})=>insertId);
        }

        getNestedRooms(){
            const room = this.id;
            const query = `SELECT * FROM ${nameSpaceRRCs} WHERE parent = :room ;`;
            return pool.roomRead(nameSpace,room,query,{
                room
            });
        }

        deleteRoom(){
            const room = this.id;
            const query = `DELETE FROM ${nameSpaceRRCs} WHERE id = :room LIMIT 1;`;
            return pool.roomWrite(nameSpace,room,query,{
                room 
            });
        }

        updateRoom(data){
            const room = this.id;
            const query = `UPDATE ${nameSpaceRRCs} SET data=:data,updatedAt=:now WHERE id = :room ;`;
            return pool.roomWrite(nameSpace,room,query,{
                room,
                data : JSON.stringify(data),
                now :  moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        getData(){
            const room = this.id;
            const query = `SELECT *,COUNT(*) AS subscribersCount FROM ${nameSpaceRRCs} WHERE id = :room LIMIT 1;`;
            return pool.roomRead(nameSpace,room,query,{
                room
            })
            .then(result=>result[0]);
        }

        exists(){
            const room = this.id;
            const query = `SELECT EXISTS( SELECT id FROM ${nameSpaceRRCs} WHERE id = :room LIMIT 1 )`;
            return pool.roomRead(nameSpace,room,query,{
                room
            })
            .then(result => Object.values(result[0])[0]);
        }

        static createUser(userName,mail,hashedPW,data){
            const query = `INSERT INTO ${nameSpaceUsers}(id, mail, hashedPW , userName, createdAt, updatedAt,data) VALUES (DEFAULT, :mail, :hashedPW ,:userName, :now,:now,:data); `;
            return pool.myExecute(query,{
                userName,
                mail,
                hashedPW,
                data : JSON.stringify(data),
                now : moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }

        static updateUser(userId,data){
            const query = `UPDATE ${nameSpaceUsers} SET data=:data,updatedAt=:now WHERE id = :userId ;`;
            return pool.myExecute(query,{
                data ,
                userId,
                now :  moment(Date.now()).format(`YYYY-MM-DD HH:mm:ss`)
            });
        }
    }
    return Publisher;
}

exports.create = nameSpace => {
    const garbageCollector = require('../scripts/garbageCollector');
    const nameSpaceRRCs = `T${nameSpace}RRCs`;
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceESCs = `T${nameSpace}ESCs`;
    const nameSpaceRSCs = `T${nameSpace}RSCs`;
    const nameSpaceUsers = `T${nameSpace}Users`;
    const nameSpaceRESCs = `T${nameSpace}RESCs`;
    return pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceUsers} (id INTEGER NOT NULL auto_increment UNIQUE ,data JSON, userName VARCHAR(255) NOT NULL, hashedPW VARCHAR(255) NOT NULL, mail VARCHAR(255) NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (id), UNIQUE(mail)) ENGINE=InnoDB;`)
    .then(()=> pool.myExecute(` CREATE TABLE IF NOT EXISTS ${nameSpaceRRCs} (id INTEGER NOT NULL auto_increment UNIQUE , parent INTEGER NULL, data JSON,admin INTEGER NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (id), FOREIGN KEY (admin) REFERENCES ${nameSpaceUsers}(id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (parent) REFERENCES ${nameSpaceRRCs}(id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceRSCs} (room INTEGER NOT NULL, user INTEGER NOT NULL, accessLevel TINYINT, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (room,user), FOREIGN KEY (room) REFERENCES ${nameSpaceRRCs}(id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user) REFERENCES ${nameSpaceUsers} (id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceERCs} (id INTEGER NOT NULL auto_increment UNIQUE , data JSON NOT NULL, author INTEGER NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (id), FOREIGN KEY (author) REFERENCES ${nameSpaceUsers}(id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceESCs} (relation TINYINT, record INTEGER NOT NULL, user INTEGER NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL, PRIMARY KEY (record,user), FOREIGN KEY (record) REFERENCES ${nameSpaceERCs} (id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (user) REFERENCES ${nameSpaceUsers} (id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;`))
    .then(()=> pool.myExecute(`CREATE TABLE IF NOT EXISTS ${nameSpaceRESCs} (room INTEGER NOT NULL, user INTEGER NOT NULL, record INTEGER NOT NULL, insertedAt DATETIME NOT NULL, FOREIGN KEY (user) REFERENCES ${nameSpaceUsers}(id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (room) REFERENCES ${nameSpaceRRCs}(id) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY (record) REFERENCES ${nameSpaceERCs} (id) ON DELETE CASCADE ON UPDATE CASCADE, UNIQUE(room,record,user)) ENGINE=InnoDB;`))
    .then(()=> garbageCollector.init(nameSpace))
    .then(()=>{
        IOs[nameSpace] = io.of(`/${nameSpace}`);
        store(nameSpace,console.log);
    })
}

exports.drop = nameSpace=>{
    const nameSpaceRRCs = `T${nameSpace}RRCs`;
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceESCs = `T${nameSpace}ESCs`;
    const nameSpaceRSCs = `T${nameSpace}RSCs`;
    const nameSpaceUsers = `T${nameSpace}Users`;
    const nameSpaceRESCs = `T${nameSpace}RESCs`;
    return pool.myExecute(`DROP TABLE ${nameSpaceUsers}, ${nameSpaceRSCs}, ${nameSpaceRRCs}, ${nameSpaceESCs}, ${nameSpaceERCs}, ${nameSpaceRESCs};`)
}

function store(nameSpace,callback){
    IOStore.push({"nameSpace" : nameSpace});
    const output = JSON.stringify(IOStore);
    fs.writeFile(path.join(__dirname,'../temp/nameSpaces.json'),output,callback);
}