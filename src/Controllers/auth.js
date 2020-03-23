const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {throw422 , throw404, throw401} = require('../utils/errors');

exports.signUp = (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(422).json({
            message : 'Validation Failed',
            data : errors.array()
        })
    }
    const Publisher = req.Publisher;
    const mail = req.body.mail;
    const userName = req.body.userName;
    const password = req.body.password;
    Publisher.getUserByMail(mail)
    .then(([user])=>{
        if(user) throw422('E-Mail address already exists');
        return bcrypt.hash(password,12);
    })
    .then(hashedPW=>{
        return Publisher.createUser(userName,mail,hashedPW)
    })
    .then(result=>{
        res.status(201).json({
            message : 'Created successfully',
            id : result.insertId,
            userName,
            mail
        })
    })
    .catch(next)
}

exports.signIn = (req,res,next)=>{
    const Publisher = req.Publisher;
    const mail = req.body.mail;
    const password = req.body.password;
    let userId;
    Publisher.getUserByMail(mail)
    .then(([user])=>{
        if(!user) throw404('User Not Found !');
        userId = user.id;
        return bcrypt.compare(password,user.hashedPW);
    })
    .then(isEqual=>{
        if(!isEqual) throw401('Wrong Password');
        const token = jwt.sign({mail,userId},process.env.PRIVATEKEY,{expiresIn : '7d'});
        res.status(200).json({
            token,
            userId
        })
    })
    .catch(next);
}