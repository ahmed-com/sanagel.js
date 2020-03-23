const jwt = require('jsonwebtoken');
const { throw401 } = require('../utils/errors');

module.exports = (req,res,nex)=>{
    try{
        const authHeader = req.get('Authorization');
        if(!authHeader) throw401('Not Authenticated');
        const token = req.get('Authorization').split(' ')[1];
        let decodedToken;
        decodedToken = jwt.verify(token,process.env.PRIVATEKEY);
        if(!decodedToken) throw401('Not Authenticated');
        req.userId = decodedToken.userId;
        next();
    }catch(err){
        let status = err.status || 500;
        let message = 'UNEXPECTED ERROR' || err.message;
        res.status(status).json({
            message
        })
    }
    
}