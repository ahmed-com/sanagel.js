const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {throw422 , throw404, throw401} = require('../utils/errors');

exports.signUp =async (req,res,next)=>{
    try{
        const Publisher = req.Publisher;
        const mail = req.body.mail;
        const userName = req.body.userName;
        const password = req.body.password;
        const [user] = await Publisher.getUserByMail(mail);
        if(user) throw422('E-Mail address already exists');
        const hashedPW = await bcrypt.hash(password,12);
        const result = await Publisher.createUser(userName,mail,hashedPW);
        res.status(201).json({
            message : 'Created successfully',
            id : result.insertId,
            userName,
            mail
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
        const [user] = await Publisher.getUserByMail(mail);
        if(!user) throw404('User Not Found !');
        const isEqual = await bcrypt.compare(password,user.hashedPW);
        console.log(isEqual,user.hashedPW);
        if(!isEqual) throw401('Wrong Password');
        const userId = user.id;
        const token = jwt.sign({mail,userId},process.env.PRIVATEKEY,{expiresIn : '7d'});
        res.status(200).json({
            token,
            userId
        });
        return;
    }catch(err){
        next(err);
        return;
    }
}