const User = require('../Models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signUp = (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(422).json({
            message : 'Validation Failed',
            data : errors.array()
        })
    }
    const mail = req.body.mail;
    const userName = req.body.userName;
    const password = req.body.password;
    bcrypt.hash(password,12)
    .then(hashedPW=>{
        return User.create({mail,userName,hashedPW});
    })
    .then(user=>{
        res.status(201).json({
            message : 'Created successfully',
            id : user.id,
            userName,
            mail
        })
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            message : "UNEXPECTED ERROR"
        });
    })
}

exports.signIn = (req,res,next)=>{
    const mail = req.body.mail;
    const password = req.body.password;
    let userId;
    User.findOne({where : {mail}})
    .then(user=>{
        if(!user){
            Promise.reject({status : 404, message : 'User not found'});
        }else{
            userId = user.id;
            return bcrypt.compare(password,user.hashedPW);
        }
    })
    .then(isEqual=>{
        if(!isEqual){
            Promise.reject({status : 401, message : 'Wrong Password'});
        }else{
            const token = jwt.sign({mail,userId},process.env.PRIVATEKEY,{expiresIn : '7d'});
            res.status(200).json({
                token,
                userId
            })
        }
    })
    .catch(err=>{
        console.log(err);
        res.status(err.status).json({
            message : err.message
        });
    });
}