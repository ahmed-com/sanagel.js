require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {signUp , signIn} = require('../../../src/Controllers/auth');

describe('signUp',()=>{
    it('should forward a 422 if the e-mail already exists',async function(){
        const req = {
            Publisher :{
                getUserByMail : jest.fn().mockResolvedValue([{id : 1}]),
            },
            body : {
                mail : 'a',
                userName : 'a',
                password : 'a'
            }
        }
        const next = jest.fn();
        const res = {};

        await signUp(req,res,next);

        return expect(next.mock.calls[0][0]).toHaveProperty('status',422);
    });

    it('should respond with 201 if no e-mail was found',async function(){
        let statusCode;
        const req = {
            Publisher :{
                getUserByMail : jest.fn().mockResolvedValue(undefined),
                createUser : jest.fn().mockResolvedValue({insertId : 1})
            },
            body : {
                mail : 'a',
                userName : 'a',
                password : 'a'
            }
        };
        const res = {
            status : function(_statusCode){
                statusCode = _statusCode;
                return this;
            },
            json : jest.fn()
        };
        const next = jest.fn();
        const mockedBcryptHash = jest.spyOn(bcrypt,"hash");

        await signUp(req,res,next);

        expect(req.Publisher.createUser).toHaveBeenCalled();
        expect(mockedBcryptHash).toHaveBeenCalled();
        expect(statusCode).toBe(201);
        expect(res.json).toHaveBeenCalled();
        mockedBcryptHash.mockRestore();
    });
});

describe('signIn',()=>{
    it('should forward a 404 if user was not found',async function(){
        const req = {
            Publisher :{
                getUserByMail : jest.fn().mockResolvedValue(undefined)
            },
            body : {
                mail : 'a',
                password : 'a'
            }
        };
        const res ={};
        const next = jest.fn();

        await signIn(req,res,next);

        return expect(next.mock.calls[0][0]).toHaveProperty('status',404);
    });

    it('should forward a 401 if passwords didnt match',async function(){
        const req = {
            Publisher :{
                getUserByMail : jest.fn().mockResolvedValue({hashedPW : 'a'})
            },
            body : {
                mail : 'a',
                password : 'a'
            }
        };
        const res ={};
        const next = jest.fn();

        await signIn(req,res,next);

        return expect(next.mock.calls[0][0]).toHaveProperty('status',401);
    });

    it('should respond with 200 if passwords match',async function(){
        let statusCode;
        const req = {
            Publisher :{
                getUserByMail : jest.fn().mockResolvedValue({id : 1,hashedPW : 'a'})
            },
            body : {
                mail : 'a',
                password : 'a'
            }
        };
        const res = {
            status : function(_statusCode){
                statusCode = _statusCode;
                return this;
            },
            json : jest.fn()
        };
        const next = jest.fn();
        const mockedBcryptCompare = jest.spyOn(bcrypt,"compare").mockResolvedValue(true);
        const mockedJWTSign = jest.spyOn(jwt,"sign");

        await signIn(req,res,next);

        expect(mockedJWTSign).toHaveBeenCalled();
        expect(mockedBcryptCompare).toHaveBeenCalled();
        expect(statusCode).toBe(200);
        expect(res.json).toHaveBeenCalled();
        mockedJWTSign.mockRestore();
        mockedBcryptCompare.mockRestore()
    });
})