

exports.subscribe = (req,res,next)=>{
    const Publisher = req.publisher
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
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.join = (req,res,next)=>{
    const Publisher = req.publisher
    const userId = req.body.userId;
    const socketId = req.body.socketId;
    client.hset('publisher',userId,socketId);
    Publisher.getRooms(userId)
    .then(rooms=>{
        rooms.forEach(room => {
            publisherIO.connected[socketId].join(room.id);            
        });
        res.status(200).json({
            message : 'Joined successfully'        
        });
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.leave = (req,res,next)=>{
    const Publisher = req.publisher
    const userId = req.body.userId;
    Publisher.getRooms(userId)
    .then(rooms=>{
        client.hget('publisher',userId,(err,socketId)=>{
            if(socketId){           
                rooms.forEach(room => {
                    publisherIO.connected[socketId].leave(room.id);                    
                });
                res.status(200).json({
                    message : 'Left successfully'        
                });
            }else{
                res.status(500).json({
                    message : 'Something went wrong'
                });
            }
        });
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.unsubscribe = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.unsubscribe(userId)
    .then(()=>{
        client.hget('publisher',userId,(err,socketId)=>{
            if(socketId){
                publisherIO.connected[socketId].leave(room);
                res.status(200).json({
                    message : 'Unsubscribed successfuly'
                });
            }else{
                res.status(200).json({
                    message : 'Unsubscribed successfuly',
                    warning : 'Please connect with a socket'
                });
            }
        });
        return Publisher.getUser(userId);
    })
    .then(user=>{
        publisherIO.to(room).emit('unsubscribtion',JSON.stringify(user));// be careful of what you emit
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.remove = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const removedId = req.body.removedId;
    const publisher = new Publisher(room);
    publisher.unsubscribe(removedId)
    .then(()=>{
        res.status(200).json({
            message : 'Removed successfuly'
        });
        client.hget('publisher',removedId,(err,socketId)=>{
            if(socketId){
                publisherIO.connected[socketId].leave(room);                
            }
        });
        return Publisher.getUser(removedId);
    })
    .then(user=>{
        publisherIO.to(room).emit('removed',JSON.stringify(user));// be careful of what you emit
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.getSubscribers = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const publisher = new Publisher(room);
    publisher.getSubscribers()
    .then(subscribers=>{
        res.status(200).json(subscribers);//CAUTION - WARNING - BE CAREFUL
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.creatRecord = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const userId = req.body.userId;  
    const record = req.body.record;  
    const publisher = new Publisher(room);
    publisher.createRecord(record)        
    .then(result=>{
        record.id = result.id;
        publisherIO.to(room).emit('recordCreated',JSON.stringify(record));
        res.status(201).json({
            message : 'Record created successfully',
            record : record
        });
        return publisher.getSubscribers();
    })
    .then(async function(subscribers){
        await (async function(){
            for(subscriber of subscribers){
                let socketId = await getSocketId(subscriber.id);
                let status = socketId ? 'seen' : 'unseen';
                await Publisher.createRecordStatus(subscriber.id,record.id,status);
            }
        })();
        await Publisher.updateRecordStatus(userId,record.id,'owner');
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.getRecord = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const recordId = req.params.recordId;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(recordId)
    .then(([result])=>{
        res.status(200).json(result);
        if(result.userId != userId){
            Publisher.updateRecordStatus(userId,recordId,'seen');
        }
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.updateRecord = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const record = req.body.record;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(record.id)
    .then(result=>{
        if(result.userId != userId){
            res.status(403).json({
                message : 'Unauthorised Action'
            });            
        }else{
            Publisher.updateRecord(record)
            .then(()=>{
                publisherIO.to(room).emit('recordUpdated',JSON.stringify(record));
                res.status(202).json({
                    message : 'Updated successfully'
                })
            })
        }        
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.deleteRecord = (req,res,next)=>{
    const Publisher = req.publisher
    const room = req.body.room;
    const recordId = req.body.recordId;
    const userId = req.body.userId;
    const publisher = new Publisher(room);
    publisher.getRecord(recordId)
    .then(result=>{
        if(result.userId != userId){
            res.status(403).json({
                message : 'Unauthorised Action'
            });
            return;
        }else{
            Publisher.deleteRecord(recordId)
            .then(()=>{
                publisherIO.to(room).emit('recordDeleted',recordId);
                res.status(202).json({
                    message : 'Deleted successfully'
                })
            })
        }        
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.getAllRecords = (req,res,next)=>{
    const Publisher = req.publisher
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
        publisherIO.to(room).emit('seen',JSON.stringify(user));/* CAUTION - WARNING - BE CAREFUL */
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}