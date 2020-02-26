const User = require('../Models/user');
const GroupMessage = require('../Models/groupMessageModel');
const io = require('../utils/socket').getIO();
const groupMessageIO = io.of('/groupMessage');
const client = require('../utils/redis').getClient();

exports.subscribe = (req,res,next)=>{
    const room = req.body.room;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.subscribe(userId)
    .then(()=>{        
        client.hget('groupMessage',userId,(err,socketId)=>{
            if(!err){
                groupMessageIO.connected[socketId].join(room);
                // groupMessageIO.to(room).emit('subscribtion',new User(userId));// be careful of what you emit
                res.status(200).json({
                    message : 'Subscribed successfuly'
                });
            }else{
                res.status(405).json({
                    message : 'Please connect with a socket first'
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

exports.join = (req,res,next)=>{
    const userId = req.body.userId;
    const socketId = req.body.socketId;
    client.hset('groupMessage',userId,socketId);
    GroupMessage.getRooms(userId)
    .then(rooms=>{
        rooms.forEach(room => {
            groupMessageIO.connected[socketId].join(room.id);
            // groupMessageIO.to(room).emit('online',new User(userId));// be careful of what you emit
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
    const userId = req.body.userId;
    GroupMessage.getRooms(userId)
    .then(rooms=>{
        client.hget('groupMessage',userId,(err,socketId)=>{
            if(socketId){           
                rooms.forEach(room => {
                    groupMessageIO.connected[socketId].leave(room.id);
                    // groupMessageIO.to(room).emit('offline',new User(userId));// be careful of what you emit
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
    const room = req.body.room;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.unsubscribe(userId)
    .then(()=>{
        client.hget('groupMessage',userId,(err,socketId)=>{
            if(socketId){
                groupMessageIO.connected[socketId].leave(room);
                // groupMessageIO.to(room).emit('unsubscribtion',new User(userId));// be careful of what you emit
                res.status(200).json({
                    message : 'Unsubscribed successfuly'
                });
            }else{
                res.status(405).json({
                    message : 'Please connect with a socket first'
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

exports.remove = (req,res,next)=>{
    const room = req.body.room;
    const removedId = req.body.removedId;
    const groupMessage = new GroupMessage(room);
    groupMessage.unsubscribe(removedId)
    .then(()=>{
        client.hget('groupMessage',removedId,(err,socketId)=>{
            if(!err){
                groupMessageIO.connected[socketId].leave(room);
                // groupMessageIO.to(room).emit('removed',new User(removedId));// be careful of what you emit                
            }
            res.status(200).json({
                message : 'Removed successfuly'
            });
        }); 
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.getSubscribers = (req,res,next)=>{
    const room = req.body.room;
    const groupMessage = new GroupMessage(room);
    groupMessage.getSubscribers()
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
    const room = req.body.room;
    const userId = req.body.userId;  
    const record = req.body.record;  
    const groupMessage = new GroupMessage(room);
    groupMessage.createRecord(userId,record)
    .then(result=>{
        record.id = result.id;
        groupMessageIO.to(room).emit('recordCreated',record);
        return groupMessage.getSubscribers();
    })
    .then(subscribers=>{
        subscribers.forEach(subscriber=>{
            let userId = subscriber.userId;
            let recordId = record.id;
            let status;
            client.hget('groupMessage',userId,(err,socketId)=>{
                if(!err){
                    status = socketId ? 'seen' : 'unseen';
                    groupMessage.createRecordStatus(userId,recordId,status);
                }
            });
        });
        return GroupMessage.updateRecordStatus(userId,record.id,'owner');
    })
    .then(()=>{
        res.status(201).json({
            message : 'Record created successfully',
            record : record
        });
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}

exports.getRecord = (req,res,next)=>{
    const room = req.body.room;
    const recordId = req.params.recordId;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.getRecord(recordId)
    .then(result=>{
        res.status(200).json({
            message : 'Record requested',
            ...result/* CAUTION - WARNING - BE CAREFUL */
        });
        if(result.userId != userId){
            GroupMessage.updateRecordStatus(userId,recordId,'seen');
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
    const room = req.body.room;
    const record = req.body.record;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.getRecord(record.id)
    .then(result=>{
        if(result.userId != userId){
            res.status(403).json({
                message : 'Unauthorised Action'
            });            
        }else{
            GroupMessage.updateRecord(record)
            .then(()=>{
                groupMessageIO.to(room).emit('recordUpdated',record);
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
    const room = req.body.room;
    const recordId = req.body.recordId;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.getRecord(recordId)
    .then(result=>{
        if(result.userId != userId){
            res.status(403).json({
                message : 'Unauthorised Action'
            });
            return;
        }else{
            GroupMessage.deleteRecord(recordId)
            .then(()=>{
                groupMessageIO.to(room).emit('recordDeleted',recordId);
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
    const room = req.body.room;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.getAllRecords()
    .then(results=>{
        res.status(200).json({
            message : 'Records requested',
            ...results/* CAUTION - WARNING - BE CAREFUL */
        });
        results.forEach(result=>{
            if(result.userId != userId){
                let recordId = result.recordId;
                GroupMessage.updateRecordStatus(userId,recordId,'seen');
            }
        });
        return User.findByPk(userId);        
    })
    .then(user=>{
        groupMessageIO.to(room).emit('seen',user);/* CAUTION - WARNING - BE CAREFUL */
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    });
}