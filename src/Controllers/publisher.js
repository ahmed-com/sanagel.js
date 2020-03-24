const { throw400 , throw403 , throw404} = require('../utils/errors');

exports.createRoom = (req,res,next)=>{//
    const Publisher = req.Publisher;
    const userId = req.body.userId;
    const data = req.body.data;
    Publisher.createRoom(userId,data)
    .then(result=>{
        res.status(201).json({
            message : "Room Created Successfully",
            room : {
                id : result.insertId,
                parent : null,
                admin : userId,
                data
            }
        })
        publisher = new Publisher(result.insertId);
        return publisher.subscribe(userId,"read-write-notify");
    })
    .then(()=>Publisher.getSocketId(userId))
    .then(socketId=>{
        if(socketId) publisher.join(socketId);
    })
    .catch(next)
}

exports.subscribe = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;
    const notify = req.body.notify;
    const accessLevel = notify ? "read-write-notify" : "read-write";
    const publisher = new Publisher(room);
    publisher.subscribe(userId,accessLevel)
    .then(()=>Publisher.getSocketId(userId))
    .then(socketId=>{         
        if(socketId){
            publisher.join(socketId);                
            res.status(200).json({
                message : 'Subscribed successfuly'
            });
        }else{
            res.status(200).json({
                message : 'Subscribed successfuly',
                warning : 'Please connect with a socket'                    
            });
        }
        return Publisher.getUser(userId);    
    })
    .then(([user])=>{
        publisher.emit('subscribtion',JSON.stringify(user));// be careful of what you emit
    })
    .catch(next);
}

exports.join = (req,res,next)=>{//
    const Publisher = req.Publisher
    const userId = req.body.userId;
    const socketId = req.body.socketId;
    let rooms;
    Publisher.setSocketId(socketId,userId);
    Publisher.getRoomsByUser(userId)
    .then(_rooms=>{
        rooms = _rooms;
        return Publisher.getUser(userId);
    })
    .then(([user])=>{
        res.status(200).json({
            message : 'Joined successfully'        
        });
        rooms.forEach(room => {
            room.join(socketId);
            room.emit('online',JSON.stringify(user));// be careful of what you emit
        });
    })
    .catch(next);
}

exports.leave = (req,res,next)=>{//
    const Publisher = req.Publisher
    const userId = req.body.userId;
    let rooms;
    let socketId;
    Publisher.getSocketId(userId)
    .then(_socketId=>{
        if(_socketId){
            socketId = _socketId;
            Publisher.removeSocketId(userId);
            return Publisher.getRooms(userId);
        }else{
            throw400('something went wrong');
        }
    })    
    .then(_rooms=>{
        rooms = _rooms;
        return Publisher.getUser(userId);
    })
    .then(([user])=>{
        res.status(200).json({
            message : 'Left successfully',                
        });
        rooms.forEach(room => {
            room.leave(socketId);
            room.emit('ofline',JSON.stringify(user));// be careful of what you emit
        });
    })
    .catch(next);
}

exports.unsubscribe = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.unsubscribe(userId)
    .then(()=>Publisher.getSocketId(userId))
    .then(socketId=>{
        if(socketId){
            publisher.leave(socketId);
            res.status(200).json({
                message : 'Unsubscribed successfuly'
            });
        }else{
            res.status(200).json({
                message : 'Unsubscribed successfuly',
                warning : 'Please connect with a socket'
            });
        }
        return Publisher.getUser(userId);
    })
    .then(([user])=>{
        publisher.emit('unsubscribtion',JSON.stringify(user));// be careful of what you emit
    })
    .catch(next);
}

exports.remove = (req,res,next)=>{//
    const Publisher = req.Publisher;
    const userId = req.body.userId;
    const room = req.body.room;
    const removedId = req.body.removedId;
    const publisher = new Publisher(room);
    publisher.getData()
    .then(([result])=>{
        if(!result) throw404('Room Not Found');
        if(result.admin != userId){
            throw403('Unauthorized Action');
            return;
        }else{
            return publisher.getUser(removedId);         
        }
    })
    .then(([user])=>{
        if(!user) throw404("User Not Found !");
        publisher.emit('removed',JSON.stringify(user));// be careful of what you emit
        return publisher.unsubscribe(removedId);
    })
    .then(()=>{
        res.status(200).json({
            message : 'Removed successfuly'
        });
        return Publisher.getSocketId(removedId);
    })
    .then(socketId=>{
        if(socketId) publisher.leave(socketId);
    })
    .catch(next);
}

exports.invite = (req,res,next) =>{//
    const Publisher = req.Publisher;
    const room = req.body.room;
    const userId = req.body.userId;
    const invitedId = req.body.invitedId;
    const inviteAccessLevel = req.body.inviteAccessLevel;
    const publisher = new Publisher(room);
    publisher.getData()
    .then(([result])=>{
        if(!result) throw404('Room Not Found');
        if(result.admin != userId){
            throw403('Unauthorized Action');
            return;
        }else{
            return publisher.getUser(invitedId);         
        }
    })
    .then(([user])=>{
        if(!user) throw404("User Not Found !");
        publisher.emit('invited',JSON.stringify(user));// be careful of what you emit
        return publisher.subscribe(removedId,inviteAccessLevel);
    })
    .then(()=>{
        res.status(200).json({
            message : 'Invited Successfuly'
        });
        return Publisher.getSocketId(removedId);
    })
    .then(socketId=>{
        if(socketId) publisher.join(socketId);
    })
    .catch(next);
}

exports.getSubscribers = (req,res,next)=>{//
    const Publisher = req.Publisher;
    const room = req.body.room;
    const publisher = new Publisher(room);
    publisher.getSubscribers()
    .then(subscribers=>{
        res.status(200).json(subscribers);//CAUTION - WARNING - BE CAREFUL
    })
    .catch(next);
}

exports.createRecord = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;  
    const data = req.body.data;
    let record;
    const publisher = new Publisher(room);
    publisher.createRecord(data,userId)        
    .then(result=>{
        record.id = result.insertId;
        record.author = userId;
        record.data = data;
        publisher.emit('recordCreated',JSON.stringify(record));
        res.status(201).json({
            message : 'Record created successfully',
            record
        });
        return publisher.getSubscribers();
    })
    .then(async function(subscribers){
        await (async function(){
            for(subscriber of subscribers){
                let socketId = await Publisher.getSocketId(subscriber.id);
                let status = socketId ? 'delivered' : 'unseen';
                await publisher.createRecordStatus(subscriber.id,record.id,status);
            }
        })();
        await publisher.updateRecordStatus(userId,record.id,'owner');// I'm not sure about this
    })
    .catch(next);
}

exports.getRecord = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const recordId = req.params.recordId;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(recordId)
    .then(([result])=>{
        if(result){
            res.status(200).json(result);
        }else{
            throw404('Record Not Found');
        }
        if(result.userId != userId){
            publisher.updateRecordStatus(userId,recordId,'seen');
        }
    })
    .catch(next);
}

exports.updateRecord = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const record = req.body.record;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(record.id)
    .then(([result])=>{
        if(!result) throw404('Record Not Found');
        if(result.author != userId){
            throw403('Unauthorized Action');           
        }else{
            return Publisher.updateRecord(record);
        }        
    })
    .then(()=>{
        publisher.emit('recordUpdated',JSON.stringify(record));
        res.status(202).json({
            message : 'Updated successfully'
        })
    })
    .catch(next);
}

exports.deleteRecord = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const recordId = req.body.recordId;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(recordId)
    .then(([result])=>{
        if(!result) throw404('Record Not Found');
        if(result.author != userId){
            throw403('Unauthorized Action');
            return;
        }else{
            return Publisher.deleteRecord(recordId);            
        }        
    })
    .then(()=>{
        publisher.emit('recordDeleted',recordId);
        res.status(202).json({
            message : 'Deleted successfully'
        })
    })
    .catch(next);
}

exports.getAllRecords = (req,res,next)=>{//
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecordsByRoom()
    .then(results=>{
        res.status(200).json({
            message : 'Records requested',
            results
        });
        results.forEach(result=>{
            if(result.author != userId){
                publisher.updateRecordStatus(userId,result.id,'seen');
            }
        });
        return Publisher.getUser(userId);        
    })
    .then(([user])=>{
        publisher.emit('seen',JSON.stringify(user));/* CAUTION - WARNING - BE CAREFUL */
    })
    .catch(next);
}

exports.getUnseenRecords = (req,res,next)=>{
    const Publisher = req.Publisher;
    const userId = req.body.userId;
    let user;
    Publisher.getRecordsByUser(userId,"unseen")
    .then(results=>{
        res.status(200).json({
            message : 'Records requested',
            results
        });
        results.forEach(result=>{
            publisher.updateRecordStatus(userId,result.id,'seen');
        });
        return Publisher.getUser(userId);
    })
    .then(([_user])=>{
        user= _user;
        return Publisher.getRoomsByUser(userId);
    })
    .then(rooms=>{
        rooms.forEach(room => {
            room.join(socketId);
            room.emit('seen',JSON.stringify(user));// be careful of what you emit
        });
    })
    .catch(next);
}

exports.updateRecordStatus = (req,res,next)=>{//this'll be called as a confirmation of emitting records.
    const Publisher = req.Publisher;
    const room = req.body.room;
    const userId = req.body.userId;
    const recordId = req.body.recordId;
    publisher = new Publisher(room);
    publisher.updateRecordStatus(userId,recordId,"seen")
    .then(()=>{
        res.status(202).json({
            message : 'Updated successfully'
        });
        return Publisher.getUser(userId);
    })
    .then(([user])=>{
        publisher.emit('seen',JSON.stringify(user));// be careful of what you emit
    })
    .catch(next);
}

exports.deleteRoom = (req,res,next)=>{//
    const Publisher = req.Publisher;
    const room = req.body.room;
    const userId = req.body.userId;
    publisher = new Publisher(room);
    publisher.getData()
    .then(([result]) => {
        if(!result) throw404('Room Not Found');
        if(result.admin != userId){
            throw403('Unauthorized Action');
            return;
        }else{
            return publisher.deleteRoom();            
        } 
    })
    .then(()=>{
        res.status(202).json({
            message : 'Deleted successfully'
        })
    })
    .catch(next)
}