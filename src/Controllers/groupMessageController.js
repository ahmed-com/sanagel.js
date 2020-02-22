const GroupMessage = require('../Models/groupMessageModel');

exports.subscribe = (req,res,next)=>{
    const room = req.body.room;
    const userId = req.body.userId;
    const socketId = req.body.socketId;
    const groupMessage = new GroupMessage(room);
    groupMessage.subscribe(userId,socketId,room,()=>{
        res.send('succeeded');
    })
}

exports.join = (req,res,next)=>{
    
}

exports.unsubscribe = (req,res,next)=>{
    
}

exports.getSubscribers = (req,res,next)=>{
    
}

exports.getRooms = (req,res,next)=>{
    
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
