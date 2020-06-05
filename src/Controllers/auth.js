const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {throw422 , throw404, throw401} = require('../scripts/errors');

exports.signUp =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const mail = req.body.mail;
        const userName = req.body.userName;
        const password = req.body.password;
        const data = req.body.data;
        const user = await Publisher.getUserByMail(mail);
        if(user) throw422('E-Mail address already exists');
        const hashedPW = await bcrypt.hash(password,12);
        const result = await Publisher.createUser(userName,mail,hashedPW,data);
        const userId = result.insertId;
        const nameSpace = Publisher.getName();
        const token = jwt.sign({nameSpace,userId},process.env.PRIVATEKEY,{expiresIn : '7d'});
        res.status(201).json({
            message : 'Created successfully',
            user : {
                id : userId,
                userName,
                mail,
                data
            },
            token
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.signIn =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const mail = req.body.mail;
        const password = req.body.password;
        const user = await Publisher.getUserByMail(mail);
        if(!user) throw404('User Not Found !');
        const isEqual = await bcrypt.compare(password,user.hashedPW);
        if(!isEqual) throw401('Wrong Password');
        const userId = user.id;
        const nameSpace = Publisher.getName();
        const token = jwt.sign({nameSpace,userId},process.env.PRIVATEKEY,{expiresIn : '7d'});
        res.status(200).json({
            message : "The Token Requested",
            token,
            user
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}

exports.updateUser = async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const userId = req.userId;
        const data = req.body.data;
        await Publisher.updateUser(userId,data);
        res.status(202).json({
            message : 'Updated successfully'
        })
    }catch(err){
        next(err);
        return;
    }
}