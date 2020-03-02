const jwt = require('jsonwebtoken');

module.exports = (req,res,nex)=>{
    try{
        const authHeader = req.get('Authorization');
        if(!authHeader){
            const err = new Error();
            err.status = 401;
            err.message = 'Not authenticated';
            throw err;
        }else{
            const token = req.get('Authorization').split(' ')[1];
            let decodedToken;    
            decodedToken = jwt.verify(token,process.env.PRIVATEKEY);
            if(!decodedToken){
                const err = new Error();
                err.status = 401;
                err.message = 'Not authenticated';
                throw err;
            }else{
                req.userId = decodedToken.userId;
                next();
            }
        }
    }catch(err){
        let status = err.status || 500;
        let message = 'UNEXPECTED ERROR' || err.message;
        res.status(status).json({
            message
        })
    }
    
}