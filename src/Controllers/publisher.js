const { throw400 , throw403 , throw404} = require('../utils/errors');
const {accessLevels , events, relations} = require('../../config/magicStrings.json');

exports.createRoom = (req,res,next)=>{//
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const data = req.body.data;
        // TO-DO GET THE DEFAULT ACCESS-LEVEL.
        const {insertId} = await Publisher.createRoom(userId,data);
        res.status(201).json({
            message : "Room Created Successfully",
            room : {
                id :insertId,
                parent : null,
                admin : userId,
                data
            }
        })
        publisher = new Publisher(insertId);
        await publisher.subscribe(userId,accessLevels.read_write_notify);
        const socketId = await Publisher.getSocketId(userId);
        if(socketId) publisher.join(socketId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.subscribe =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;
        const notify = req.body.notify;
        // TO-DO USE THE DEFAULT ACCESS-LEVEL.
        const accessLevel = notify ? accessLevels.read_write_notify : accessLevels.read_write;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found');
        await publisher.subscribe(userId,accessLevel);
        res.status(200).json({
            message : 'Subscribed successfuly'
        });
        const socketId = await Publisher.getSocketId(userId);
        if(socketId) publisher.join(socketId);                
        const user = await Publisher.getUser(userId);    
        publisher.emit(events.subscribtion,JSON.stringify(user));// be careful of what you emit
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.join =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const userId = req.body.userId;
        const socketId = req.body.socketId;
        Publisher.setSocketId(socketId,userId);
        res.status(200).json({
            message : 'Joined successfully'        
        });
        const rooms =await Publisher.getRoomsByUser(userId);
        const user = await Publisher.getUser(userId);
        rooms.forEach(room => {
            room.join(socketId);
            room.emit(events.online,JSON.stringify(user));// be careful of what you emit
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.leave =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const userId = req.body.userId;
        const socketId =await Publisher.getSocketId(userId);
        if(!socketId) throw400('something went wrong');
        Publisher.removeSocketId(userId);
        res.status(200).json({
            message : 'Left successfully',                
        });
        const rooms =await  Publisher.getRooms(userId);
        const user = await Publisher.getUser(userId);
        rooms.forEach(room => {
            room.leave(socketId);
            room.emit(events.offline,JSON.stringify(user));// be careful of what you emit
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.unsubscribe =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found!');
        await publisher.unsubscribe(userId);
        res.status(200).json({
            message : 'Unsubscribed successfuly'
        });
        const socketId = await Publisher.getSocketId(userId);
        if(socketId) publisher.leave(socketId);
        const user = await Publisher.getUser(userId);
        publisher.emit(events.unsubscribtion,JSON.stringify(user));// be careful of what you emit
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.remove =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const room = req.body.room;
        const removedId = req.body.removedId;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.admin !== userId) throw403('Unauthorized Action');
        const user= await Publisher.getUser(removedId);
        if(!user) throw404("User Not Found !");
        await publisher.unsubscribe(removedId);
        res.status(200).json({
            message : 'Removed successfuly'
        });
        const socketId = await Publisher.getSocketId(removedId);
        if(socketId) publisher.leave(socketId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.invite = async (req,res,next) =>{//
    try{
        const Publisher = req.Publisher;
        const room = req.body.room;
        const userId = req.body.userId;
        const invitedId = req.body.invitedId;
        const inviteAccessLevel = req.body.inviteAccessLevel;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found');
        if(result.admin != userId) throw403('Unauthorized Action');
        const user = await publisher.getUser(invitedId);         
        if(!user) throw404("User Not Found !");
        //TO-DO CHECK THE ACCESSLEVEL GIVEN IF IT WOULD FORCE A USER TO BE NOTIFIED.
        await publisher.forceSubscribe(invitedId,inviteAccessLevel);
        res.status(200).json({
            message : 'Invited Successfuly'
        });
        publisher.emit(events.invited,JSON.stringify(user));// be careful of what you emit
        const socketId = await Publisher.getSocketId(invitedId);
        if(socketId) publisher.join(socketId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getSubscribers =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher;
        const room = req.body.room;
        const publisher = new Publisher(room);
        const subscribers= await publisher.getSubscribers();
        res.status(200).json(subscribers);//CAUTION - WARNING - BE CAREFUL
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.createRecord =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;  
        const data = req.body.data;
        let record;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found!');
        const accessLevel = publisher.getAccessLevel(userId);
        if(accessLevel !== accessLevels.read_write && accessLevel !== accessLevels.read_write_notify) throw403('Unauthorized Action');
        const {insertId} =await publisher.createRecord(data,userId);
        const record = {
            id : insertId,
            author : userId,
            data
        };
        res.status(201).json({
            message : 'Record created successfully',
            record
        });
        publisher.emit(events.recordCreated,JSON.stringify(record));
        const subscribers = await publisher.getSubscribers();
        await (async function(){
            for(subscriber of subscribers){
                let socketId = await Publisher.getSocketId(subscriber.id);
                if(socketId){
                    await publisher.upsertRecordStatus(subscriber.id,record.id,relations.delivered);
                    publisher.emit(events.delivered , JSON.stringify({user , record}));
                }else{
                    await publisher.upsertRecordStatus(subscriber.id,record.id,relations.unseen);
                }
            }
        })();
        await publisher.upsertRecordStatus(userId,record.id,'owner');// I'm not sure about this
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getRecord =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const recordId = req.params.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const {relation} = await Publisher.getRecordStatus(recordId,userId);
        if(!publisher.exists()) throw404('Room Not Found!');
        // TO-DO CHECK FROM THE SCHEMA IF YOU SHOULD BE A SUBSCRIBER TO HAVE A READ ACCESS.
        const record =await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        if(record.room !== room) throw400('Bad Request');
        res.status(200).json({record});
        if(record.author === userId) return;
        if(relation !== relations.seen){
            publisher.upsertRecordStatus(userId,recordId,relations.seen);
            publisher.emit(events.seen,JSON.stringify({user , record}));/* CAUTION - WARNING - BE CAREFUL */
        }
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.updateRecord =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const data = req.body.data;
        const recordId = req.body.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found!');
        const record = await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        if(record.author != userId) throw403('Unauthorized Action');
        if(record.room !== room) throw400('Bad Request');
        await publisher.updateRecord(recordId,data);
        res.status(202).json({
            message : 'Updated successfully'
        })
        publisher.emit(events.recordUpdated,JSON.stringify(record));
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.deleteRecord =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const recordId = req.body.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found!');
        const record = await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        if(record.author != userId) throw403('Unauthorized Action');
        if(record.room !== room) throw400('Bad Request');
        await publisher.deleteRecord(recordId);            
        res.status(202).json({
            message : 'Deleted successfully'
        })
        publisher.emit(events.recordDeleted,recordId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getAllRecords =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found!');
        const records =await publisher.getRecordsByRoom();
        res.status(200).json({
            message : 'Records requested',
            records
        });
        const user = await Publisher.getUser(userId);
        records.forEach(record=>{
            if(record.author !== userId){
                const {relation} = await Publisher.getRecordStatus(record.id,userId);
                if(relation !== relations.seen){
                    publisher.upsertRecordStatus(userId,recordId,relations.seen);
                    publisher.emit(events.seen,JSON.stringify({user , record}));/* CAUTION - WARNING - BE CAREFUL */
                }
            }
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getUnseenRecords =async (req,res,next)=>{ // this function is for notification display
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const records = await Publisher.getRecordsByUser(userId,relations.unseen);
        const user = Publisher.getUser(userId);
        res.status(200).json({
            message : 'Records requested',
            records
        });
        records.forEach(record=>{
            let publisher = new Publisher(record.room);
            await publisher.upsertRecordStatus(userId,record.id,relations.delivered);
            publisher.emit(events.delivered,JSON.stringify({user , record}));
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getUserRecords = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const records = await Publisher.getRecordsByUser(userId,relations.owner);
        res.status(200).json({
            message : 'Records requested',
            records
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.seenCheck =async (req,res,next)=>{//this'll be called as a confirmation of emitting records, or answering to notifications.
    try{
        const Publisher = req.Publisher;
        const room = req.body.room;
        const userId = req.body.userId;
        const recordId = req.body.recordId;
        const publisher = new Publisher(room);
        if(!publisher.exists()) throw404('Room Not Found!');
        const record = await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        if(record.room !== room) throw400('Bad Request');
        const {relation} = await publisher.getRecordStatus(recordId);
        if(relation !== relations.seen){ 
            await publisher.upsertRecordStatus(userId,recordId,relations.seen);
            res.status(202).json({
                message : 'Seen Successfully'
            });
            const user =await Publisher.getUser(userId);
            publisher.emit(events.seen,JSON.stringify({user,record}));// be careful of what you emit
            return;
        }else{
            throw400('Bad Request');
        }
    }catch(err){
        next(err);
        return;
    }
}

exports.deleteRoom =async (req,res,next)=>{//
    try{
        const Publisher = req.Publisher;
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const record = await publisher.getData();
        if(!record) throw404('Room Not Found!');
        if(record.admin != userId) throw403('Unauthorized Action');
        await publisher.deleteRoom();            
        res.status(202).json({
            message : 'Deleted successfully'
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}