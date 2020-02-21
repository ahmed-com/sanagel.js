let io;

exports.init = httpServer=>{    
    io = require('socket.io')(httpServer);
    return io;
}

exports.getIO = ()=>{
    if(io){
        return io;
    }else{
        throw new Error('Socket.io is not initialized');
    }
}