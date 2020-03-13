const { throw400 , throw403 , throw404} = require('../utils/errors');

exports.subscribe = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.subscribe(userId)
    .then(()=>publisher.getSocketId(userId))
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
    .then(user=>{
        publisher.emit('subscribtion',JSON.stringify(user));// be careful of what you emit
    })
    .catch(err => next(err));
}

exports.join = (req,res,next)=>{
    const Publisher = req.Publisher
    const userId = req.body.userId;
    const socketId = req.body.socketId;
    Publisher.setSocketId(socketId,userId);
    Publisher.getRooms(userId)
    .then(rooms=>{
        res.status(200).json({
            message : 'Joined successfully'        
        });
        rooms.forEach(room => {
            room.join(socketId);           
        });
    })
    .catch(err => next(err));
}

exports.leave = (req,res,next)=>{
    const Publisher = req.Publisher
    const userId = req.body.userId;
    let socketId;
    Publisher.getSocketId(userId)
    .then(_socketId=>{
        if(_socketId){
            socketId = _socketId;
            return Publisher.getRooms(userId);
        }else{
            throw400('something went wrong');
        }
    })    
    .then(rooms=>{
        res.status(200).json({
            message : 'Left successfully',                
        });
        rooms.forEach(room => {
            room.leave(socketId);                    
        });
    })
    .catch(err => next(err));
}

exports.unsubscribe = (req,res,next)=>{
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
    .then(user=>{
        publisher.emit('unsubscribtion',JSON.stringify(user));// be careful of what you emit
    })
    .catch(err => next(err));
}

exports.remove = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const removedId = req.body.removedId;
    const publisher = new Publisher(room);
    publisher.unsubscribe(removedId)
    .then(()=>{
        res.status(200).json({
            message : 'Removed successfuly'
        });
        return Publisher.getSocketId(removedId);
    })
    .then(socketId=>{
        publisher.leave(socketId);
        return Publisher.getUser(removedId);
    })
    .then(user=>{
        publisher.emit('removed',JSON.stringify(user));// be careful of what you emit
    })
    .catch(err => next(err));
}

exports.getSubscribers = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const publisher = new Publisher(room);
    publisher.getSubscribers()
    .then(subscribers=>{
        res.status(200).json(subscribers);//CAUTION - WARNING - BE CAREFUL
    })
    .catch(err => next(err));
}

exports.creatRecord = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;  
    const record = req.body.record;  
    const publisher = new Publisher(room);
    publisher.createRecord(record)        
    .then(result=>{
        record.id = result.id;
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
                let status = socketId ? 'seen' : 'unseen';
                await Publisher.createRecordStatus(subscriber.id,record.id,status);
            }
        })();
        await Publisher.updateRecordStatus(userId,record.id,'owner');
    })
    .catch(err => next(err));
}

exports.getRecord = (req,res,next)=>{
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
            Publisher.updateRecordStatus(userId,recordId,'seen');
        }
    })
    .catch(err => next(err));
}

exports.updateRecord = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const record = req.body.record;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(record.id)
    .then(result=>{
        if(!result) throw404('Record Not Found');
        if(result.userId != userId){
            throw403('Unauthorized Action');           
        }else{
            Publisher.updateRecord(record)
            .then(()=>{
                publisher.emit('recordUpdated',JSON.stringify(record));
                res.status(202).json({
                    message : 'Updated successfully'
                })
            })
        }        
    })
    .catch(err => next(err));
}

exports.deleteRecord = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const recordId = req.body.recordId;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(recordId)
    .then(result=>{
        if(!result) throw404('Record Not Found');
        if(result.userId != userId){
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
    .catch(err => next(err));
}

exports.getAllRecords = (req,res,next)=>{
    const Publisher = req.Publisher
    const room = req.body.room;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getAllRecords()
    .then(results=>{
        res.status(200).json({
            message : 'Records requested',
            results
        });
        results.forEach(result=>{
            if(result.userId != userId){
                Publisher.updateRecordStatus(userId,result.id,'seen');
            }
        });
        return Publisher.getUser(userId);        
    })
    .then(user=>{
        publisher.emit('seen',JSON.stringify(user));/* CAUTION - WARNING - BE CAREFUL */
    })
    .catch(err => next(err));
}