const jwt = require('jsonwebtoken');
const { throw401, throw422 } = require('../scripts/errors');

module.exports = (req,res,next)=>{
    try{
        const authHeader = req.get('Authorization');
        if(!authHeader) throw401('Not Authenticated');
        const token = req.get('Authorization').split(' ')[1];
        if(!token) throw422('Bad Authorization Header');
        let decodedToken;
        try{
           decodedToken = jwt.verify(token,process.env.PRIVATEKEY);
        }catch(err){
            throw401('Invalid Token');
        }
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