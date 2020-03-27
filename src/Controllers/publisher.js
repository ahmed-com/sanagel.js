const { throw400 , throw403 , throw404} = require('../scripts/errors');
const {accessLevels , events, relations} = require('../../config/magicStrings.json');
const {canWrite, canInvite , canRemove, addNotify, hasNotify , stripNotify} = require('../scripts/manage-access-level');

exports.createRoom = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const data = req.body.data;
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
        const publisher = new Publisher(insertId);
        await publisher.subscribe(userId,accessLevels.read_write_invite_remove_notify);
        const socketId = await Publisher.getSocketId(userId);
        if(socketId) publisher.join(socketId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.subscribe =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found');
        if(result.channel && result.channel.private) throw403('Unauthorized Action');
        const accessLevel = result.data.defaultAccessLevel || accessLevels.read_only;
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

exports.join =async (req,res,next)=>{
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

exports.leave =async (req,res,next)=>{
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

exports.unsubscribe =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const roomExists = await publisher.exists();
        if(!roomExists) throw404('Room Not Found!');
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

exports.remove =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const room = req.body.room;
        const removedId = req.body.removedId;
        const publisher = new Publisher(room);
        const accessLevel = await publisher.getAccessLevel(userId);
        if(!accessLevel) throw404('Room Not Found!');
        if(!canRemove(accessLevel)) throw403('Unauthorized Action');
        const user= await Publisher.getUser(removedId);
        if(!user) throw404("User Not Found !");
        await publisher.unsubscribe(removedId);
        res.status(200).json({
            message : 'Removed successfuly'
        });
        const remover = await publisher.getUser(userId);
        publisher.emit(events.removed,JSON.stringify({user,remover}));// be careful of what you emit
        const socketId = await Publisher.getSocketId(removedId);
        if(socketId) publisher.leave(socketId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.invite = async (req,res,next) =>{
    try{
        const Publisher = req.Publisher;
        const room = req.body.room;
        const userId = req.body.userId;
        const invitedId = req.body.invitedId;
        const inviteAccessLevel = req.body.inviteAccessLevel;
        const publisher = new Publisher(room);
        const accessLevel = await publisher.getAccessLevel(userId);
        if(!accessLevel) throw404('Room Not Found');
        if(!canInvite(accessLevel,inviteAccessLevel)) throw403('Unauthorized Action');
        const user = await publisher.getUser(invitedId);
        if(!user) throw404("User Not Found !");
        stripNotify(inviteAccessLevel);
        await publisher.forceSubscribe(invitedId,inviteAccessLevel);
        res.status(200).json({
            message : 'Invited Successfuly'
        });
        const inviter = await publisher.getUser(userId);
        publisher.emit(events.invited,JSON.stringify({user,inviter}));// be careful of what you emit
        const socketId = await Publisher.getSocketId(invitedId);
        if(socketId) publisher.join(socketId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getSubscribers =async (req,res,next)=>{
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

exports.createRecord =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;  
        const data = req.body.data;
        const publisher = new Publisher(room);
        const accessLevel = publisher.getAccessLevel(userId);
        if(!accessLevel) throw404('Room Not Found!');
        if(!canWrite(accessLevel)) throw403('Unauthorized Action');
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
        await publisher.upsertRecordStatus(userId,record.id,relations.owner);// I'm not sure about this
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.getRecord =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const recordId = req.body.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const relation = await publisher.getRecordStatus(recordId,userId);
        const data = await publisher.getData();
        if(!data) throw404('Room Not Found!');
        if(data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber) throw403('Unauthorized Action');
        }
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

exports.updateRecord =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const data = req.body.data;
        const recordId = req.body.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const roomExists = await publisher.exists();
        if(!roomExists) throw404('Room Not Found!');
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

exports.deleteRecord =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const recordId = req.body.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const roomExists = await publisher.exists();
        if(!roomExists) throw404('Room Not Found!');
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

exports.getAllRecords =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const data = await publisher.getData();
        if(!data) throw404('Room Not Found!');
        if(data.channel){
            const isSubscriber = publisher.isSubscriber(userId);
            if(!isSubscriber) throw403('Unauthorized Action');
        }
        const records =await publisher.getRecordsByRoom();
        res.status(200).json({
            message : 'Records requested',
            records
        });
        const user = await Publisher.getUser(userId);
        records.forEach(async record=>{
            if(record.author !== userId){
                const relation = await publisher.getRecordStatus(record.id,userId);
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
        records.forEach(async record=>{
            let publisher = new Publisher(record.room);
            await publisher.upsertRecordStatus(userId,record.id,relations.delivered);
            publisher.emit(events.delivered,JSON.stringify({user , record}));// be careful of what you emit
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
        const roomExists = await publisher.exists();
        if(!roomExists) throw404('Room Not Found!');
        const record = await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        if(record.room !== room) throw400('Bad Request');
        const relation = await publisher.getRecordStatus(recordId);
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

exports.deleteRoom =async (req,res,next)=>{// I'm Not Sure About This At All
    try{
        const Publisher = req.Publisher;
        const room = req.body.room;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.admin !== userId) throw403('Unauthorized Action');
        await publisher.deleteRoom();            
        res.status(202).json({
            message : 'Deleted successfully'
        });
        const subscribers = await publisher.getSubscribers();
        subscribers.forEach(async subscriber=>{
            publisher.emit(events.roomDeleted,true);
            const socketId = await publisher.getSocketId(subscriber.id);
            if(socketId) publisher.leave(socketId);
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}