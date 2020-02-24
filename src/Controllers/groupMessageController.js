// const User = require('../Models/user');
const GroupMessage = require('../Models/groupMessageModel');
const io = require('../utils/socket').getIO();
const groupMessageIO = io.of('/groupMessage');
const client = require('../utils/redis').getClient();

exports.subscribe = (req,res,next)=>{
    const room = req.body.room;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.subscribe(userId,()=>{        
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
}

exports.join = (req,res,next)=>{
    const userId = req.body.userId;
    const socketId = req.body.socketId;
    client.hset('groupMessage',userId,socketId);
    GroupMessage.getRooms(userId,rooms=>{
        rooms.forEach(room => {
            groupMessageIO.connected[socketId].join(room);
            // groupMessageIO.to(room).emit('online',new User(userId));// be careful of what you emit
        });
        res.status(200).json({
            message : 'Joined successfully'        
        });
    });
}

exports.leave = (req,res,next)=>{
    const userId = req.body.userId;
    client.hget('groupMessage',userId,(err,socketId)=>{
        if(!err){
            groupMessageIO.connected[socketId].leave(room);            
            GroupMessage.getRooms(userId,rooms=>{
                rooms.forEach(room => {
                    groupMessageIO.connected[socketId].leave(room);
                    // groupMessageIO.to(room).emit('offline',new User(userId));// be careful of what you emit
                });
                res.status(200).json({
                    message : 'Left successfully'        
                });
            });
        }else{
            res.status(500).json({
                message : 'Something went wrong'
            });
        }
    });
}

exports.unsubscribe = (req,res,next)=>{
    const room = req.body.room;
    const userId = req.body.userId;
    const groupMessage = new GroupMessage(room);
    groupMessage.unsubscribe(userId,()=>{
        client.hget('groupMessage',userId,(err,socketId)=>{
            if(!err){
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
    });
}

exports.remove = (req,res,next)=>{
    const room = req.body.room;
    const removedId = req.body.removedId;
    const groupMessage = new GroupMessage(room);
    groupMessage.unsubscribe(removedId,()=>{
        client.hget('groupMessage',removedId,(err,socketId)=>{
            if(!err){
                groupMessageIO.connected[socketId].leave(room);
                // groupMessageIO.to(room).emit('removed',new User(removedId));// be careful of what you emit                
            }
            res.status(200).json({
                message : 'Removed successfuly'
            });
        }); 
    });
}

// need to implement the user model first
exports.getSubscribers = (req,res,next)=>{
    const room = req.body.room;
    const groupMessage = new GroupMessage(room);
    groupMessage.getSubscribers(subscribers=>{
        res.status(200).json(subscribers);//CAUTION - WARNING - BE CAREFUL
    });
}

exports.getRecordStatus = (req,res,next)=>{
    
}

exports.creatRecord = (req,res,next)=>{
    
}

exports.getRecord = (req,res,next)=>{
    
}

exports.getAllRecords = (req,res,next)=>{
    
}

exports.updateRecord = (req,res,next)=>{
    
}

exports.deleteRecord = (req,res,next)=>{
    
}
