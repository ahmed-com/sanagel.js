const { throw400 , throw403 , throw404} = require('../scripts/errors');
const {accessLevels , events, relations} = require('../../config/magicStrings.json');
const {canWrite, canInvite , canRemove, addNotify, hasNotify , stripNotify} = require('../scripts/manage-access-level');

exports.createRoom = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const userId = req.body.userId;
        const data = req.body.data;
        const insertId = await Publisher.createRoom(userId,data);
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
        if(result.data.channel && result.data.channel.private) throw403('Unauthorized Action');
        const accessLevel = result.data.defaultAccessLevel || accessLevels.read_only;
        await publisher.subscribe(userId,accessLevel);
        res.status(200).json({
            message : 'Subscribed successfuly'
        });
        const socketId = await Publisher.getSocketId(userId);
        if(socketId) publisher.join(socketId);                
        const user = await Publisher.getUserPublic(userId);    
        publisher.emit(events.subscribtion,JSON.stringify(user));
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
        const rooms =await Publisher.getRoomsByUser(userId);
        res.status(200).json({
            message : 'Joined successfully',
            rooms
        });
        const user = await Publisher.getUserPublic(userId);
        rooms.forEach(room => {
            room.join(socketId);
            room.emit(events.online,JSON.stringify(user));
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
        const user = await Publisher.getUserPublic(userId);
        rooms.forEach(room => {
            room.leave(socketId);
            room.emit(events.offline,JSON.stringify(user));
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
        const user = await Publisher.getUserPublic(userId);
        publisher.emit(events.unsubscribtion,JSON.stringify(user));
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
        const user= await Publisher.getUserPublic(removedId);
        if(!user) throw404("User Not Found !");
        await publisher.unsubscribe(removedId);
        res.status(200).json({
            message : 'Removed successfuly'
        });
        const remover = await publisher.getUserPublic(userId);
        publisher.emit(events.removed,JSON.stringify({user,remover}));
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
        const user = await publisher.getUserPublic(invitedId);
        if(!user) throw404("User Not Found !");
        stripNotify(inviteAccessLevel);
        await publisher.forceSubscribe(invitedId,inviteAccessLevel);
        res.status(200).json({
            message : 'Invited Successfuly'
        });
        const inviter = await publisher.getUserPublic(userId);
        publisher.emit(events.invited,JSON.stringify({user,inviter}));
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
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorised Request');
            }
        }
        const subscribers= await publisher.getSubscribers();
        res.status(200).json({
            message : "Subscribers Requested",
            subscribers
        });
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
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        const accessLevel = await publisher.getAccessLevel(userId);
        if(!accessLevel){
            if(result.data.channel && result.data.channel.private) throw404('Room Not Found!');
            throw403('Unauthorized Action');
        }
        if(!canWrite(accessLevel)) throw403('Unauthorized Action');
        const insertId =await publisher.createRecordWithReference(data,userId);
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
                    await Publisher.upsertRecordStatus(subscriber.id,record.id,relations.delivered);
                    const user = Publisher.getUserPublic(subscriber.id);
                    publisher.emit(events.delivered , JSON.stringify({user , record}));
                }else{
                    await Publisher.upsertRecordStatus(subscriber.id,record.id,relations.unseen);
                }
            }
        })();
        await Publisher.upsertRecordStatus(userId,record.id,relations.owner);
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
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
        const record =await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        if(record.room !== room) throw400('Bad Request');
        res.status(200).json({
            message : "Record Requesed",
            record
        });
        const relation = await publisher.getRecordStatus(recordId,userId);
        if(record.author === userId) return;
        if(relation === relations.seen || relation === relations.owner) return;
        const user = await Publisher.getUserPublic(userId);
        Publisher.upsertRecordStatus(userId,recordId,relations.seen);
        const rooms= await Publisher.getRoomsByRecord(recordId);
        rooms.forEach(room=>{
            room.emit(events.seen,JSON.stringify({user , record}));
            room.clearCache();
        });
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
        if(record.author !== userId) throw403('Unauthorized Action');
        if(record.room !== room) throw400('Bad Request');
        await publisher.updateRecord(recordId,data);
        res.status(202).json({
            message : 'Updated successfully'
        })
        const rooms = await Publisher.getRoomsByRecord(recordId);
        rooms.forEach(room=>{
            room.emit(events.recordUpdated,JSON.stringify(record));
            room.clearCache();
        })
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
        const rooms = await Publisher.getRoomsByRecord(recordId);
        rooms.forEach(room=>{
            room.emit(events.recordDeleted,recordId);
            room.clearCache();
        });
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
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
        const records =await publisher.getRecordsByRoom();
        res.status(200).json({
            message : 'Records requested',
            records
        });
        const user = await Publisher.getUserPublic(userId);
        records.forEach(async record=>{
            if(record.author !== userId){
                const relation = await publisher.getRecordStatus(record.id,userId);
                if(relation !== relations.seen || relation !== relations.owner){
                    Publisher.upsertRecordStatus(userId,record.id,relations.seen);
                    const rooms = await Publisher.getRoomsByRecord(record.id);
                    rooms.forEach(room=>{
                        room.emit(events.seen,JSON.stringify({user , record}));
                        room.clearCache();
                    })
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
        const records = await Publisher.getRecordsByUserRelation(userId,relations.unseen);
        res.status(200).json({
            message : 'Records requested',
            records
        });
        Publisher.upsertRecordStatus(userId,record.id,relations.delivered);
        const user = Publisher.getUserPublic(userId);
        records.forEach(async record=>{
            const rooms = await Publisher.getRoomsByRecord(record.id);
            rooms.forEach(room=>{
                room.emit(events.delivered,JSON.stringify({user , record}));
                room.clearCache();
            })
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
        const records = await Publisher.getRecordsByUserRelation(userId,relations.owner);
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
        const result = await publisher.getData();
        if(!data) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
        const record = await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        const relation = await publisher.getRecordStatus(recordId);
        if(relation === relations.seen || relation === relations.owner) throw400('Bad Request');
        await Publisher.upsertRecordStatus(userId,recordId,relations.seen);
        res.status(202).json({
            message : 'Seen Successfully'
        });
        const user =await Publisher.getUserPublic(userId);
        const rooms = await Publisher.getRoomsByRecord(recordId);
        rooms.forEach(room=>{
            room.emit(events.seen,JSON.stringify({user,record}));
            room.clearCache();
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.copyRecord = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const recordId = req.body.recordId;
        const room = req.body.room;
        const userId = req.body.userId;
        const destination = req.body.destination;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
        const record =await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found!');
        if(!record.data.sharable) throw403('Unauthorized Action');
        const destinationPublisher = new Publisher(destination);
        const duplicateRecord = await destinationPublisher.isHost(recordId,userId);
        if(duplicateRecord) throw400('Dublicate Record');
        const accessLevel = await destinationPublisher.getAccessLevel(userId);
        if(!accessLevel){
            const result = await destinationPublisher.getData();
            if(!result) throw404('Room Not Found');
            if(result.data.channel && result.data.channel.private) throw404('Room Not Found!');
            throw403('Unauthorized Action');
        }
        if(!canWrite(accessLevel)) throw403('Unauthorized Action');
        await destinationPublisher.addReference(recordId,userId);
        res.status(201).json({
            message : "copied successfully"
        });
        const user = await Publisher.getUserPublic(userId);
        destinationPublisher.emit(events.recordCopied,JSON.stringify({user,record}));
        const relation = await destinationPublisher.getRecordStatus(recordId,userId);
        if(relation !== relations.owner){
            Publisher.upsertRecordStatus(userId,recordId,relations.owner);
        }
        const rooms = await Publisher.getRoomsByRecord(recordId);
        rooms.forEach(room=>{
            if(room.id !== destination){
                room.emit(events.incrementCopies,recordId);
                room.clearCache();
            }
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.cutRecord = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const recordId = req.body.recordId;
        const room = req.body.room;
        const userId = req.body.userId;
        const destination = req.body.destination;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
        const record =await publisher.getRecord(recordId);
        if(!record) throw404("Record Not Found!");
        const isHost = await publisher.isHost(recordId,userId);
        if(!isHost) throw403('Unauthorized Action!');
        if(!record.data.sharable) throw403('Unauthorized Action');
        const destinationPublisher = new Publisher(destination);
        const duplicateRecord = await destinationPublisher.isHost(recordId,userId);
        if(duplicateRecord) throw400('Dublicate Record');
        const accessLevel = await destinationPublisher.getAccessLevel(userId);
        if(!accessLevel){
            const result = await destinationPublisher.getData();
            if(!result) throw404('Room Not Found');
            if(result.data.channel && result.data.channel.private) throw404('Room Not Found!');
            throw403('Unauthorized Action');
        }
        if(!canWrite(accessLevel)) throw403('Unauthorized Action');
        await publisher.changeReference(recordId,userId,destination);
        res.status(201).json({
            message : "cutted successfully"
        });
        const user = await Publisher.getUserPublic(userId);
        destinationPublisher.emit(events.recordAdded,JSON.stringify({user,record}));
        destinationPublisher.clearCache();
        publisher.emit(events.recordRemoved,recordId);
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.removeRecord = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher
        const room = req.body.room;
        const recordId = req.body.recordId;
        const userId = req.body.userId;
        const publisher = new Publisher(room);
        const result = await publisher.getData();
        if(!result) throw404('Room Not Found!');
        if(result.data.channel){
            const isSubscriber = await publisher.isSubscriber(userId);
            if(!isSubscriber){
                if(result.data.channel.private) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
        const record = await publisher.getRecord(recordId);
        if(!record) throw404('Record Not Found');
        const isHost = await publisher.isHost(recordId,userId);
        if(!isHost) throw403('Unauthorized Action');
        await publisher.removeReference(recordId,userId);            
        res.status(202).json({
            message : 'Removed successfully'
        });
        publisher.emit(events.recordRemoved,recordId);
        const rooms = await Publisher.getRoomsByRecord(recordId);
        rooms.forEach(room=>{
            if(room.id !== publisher.id){
                room.emit(events.decrementCopies,recordId);
                room.clearCache();
            }
        });
        return;
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
        if(result.data.channel && result.data.channel.private){
            if(result.admin !== userId){
                const isSubscriber = publisher.isSubscriber(userId);
                if(isSubscriber) throw404('Room Not Found!');
                throw403('Unauthorized Action');
            }
        }
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