const router = require('express').Router();
const is_auth = require('../middlewares/is-auth');
const { check } = require('express-validator');
const auth = require('../Controllers/auth');
const validate = require('../middlewares/validate');

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
        check('data')
        .isJSON()
        .withMessage('Please Send Valid JSON String')
        .custom(( data , { req } )=>{
            req.body.data = JSON.parse(data);
            return Promise.resolve();
        })
],validate,auth.signUp);

router.post('/signin',[
    check('mail')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
    check('password')
        .trim()
        .isLength({min : 5, max : 14})
        .withMessage('Please enter a valid password.')
],validate,auth.signIn);

router.put('/update',is_auth,auth.updateUser);

module.exports = router;