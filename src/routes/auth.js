const router = require('express').Router();
const { body } = require('express-validator/check')
const auth = require('../Controllers/auth');
const User = require('../Models/user');

router.post('/signup',[
    body('mail')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((mail,{req})=>{
            return User.findOne({where : {mail}}).then(user=>{
                if(user){
                    return Promise.reject('E-Mail address already exists');
                }
            });
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({min : 5, max : 14})
        .withMessage('Please enter a valid password.'),
    body('userName')
        .trim()
        .not()
        .isEmpty()
        .isAlphanumeric(),
    body('confirmPassword')
        .trim()
        .custom((password,{req})=>{
            if(password !== req.body.password){
                throw new Error('Passwords need to match.');
            }
        })
],auth.signUp);

router.post('/signin',auth.signIn);

module.exports = router;