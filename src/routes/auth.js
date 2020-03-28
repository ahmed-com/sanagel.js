const router = require('express').Router();
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

module.exports = router;