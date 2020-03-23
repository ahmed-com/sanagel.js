const router = require('express').Router();
const { check } = require('express-validator');
const auth = require('../Controllers/auth');

router.post('/signup',[
    check('mail')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
    check('password')
        .trim()
        .isLength({min : 5, max : 14})
        .withMessage('Please enter a valid password.'),
    check('userName')
        .trim()
        .not()
        .isEmpty()
        .isAlphanumeric(),
    check('confirmPassword')
        .trim()
        .custom((password,{req})=>{
            if(password !== req.body.password){
                throw new Error('Passwords need to match.');
            }
        })
],auth.signUp);

router.post('/signin',auth.signIn);

module.exports = router;