require('dotenv').config();
const is_auth = require('../../../src/middlewares/is-auth');
const jwt = require('jsonwebtoken');

describe('is_auth',()=>{
    it('should respond with 401 if no authorization header was found',function(){
        let statusCode;
        let message;
        const req = {
            get:headerName => {
                return headerName === 'Authorization' ? null : true;
            }
        };
        const res = {
            status : function(_statusCode){
                statusCode = _statusCode;
                return this;
            },
            json : obj=>{
                message = obj.message
            }
        }
        is_auth(req,res);
        expect(statusCode).toBe(401);
        expect(message).toBeDefined();
    });

    it('should respond with 422 if authorization header is one string',function(){
        let statusCode;
        let message;
        const req = {
            get:headerName => 'xyz'
        };
        const res = {
            status : function(_statusCode){
                statusCode = _statusCode;
                return this;
            },
            json : obj=>{
                message = obj.message
            }
        }
        is_auth(req,res);
        expect(statusCode).toBe(422);
        expect(message).toBeDefined();
    });

    it('should respond with 401 if the token cannot be verified',function(){
        let statusCode;
        let message;
        const req = {
            get:headerName => 'Bearer xyz.xyz.xyz'
        };
        const res = {
            status : function(_statusCode){
                statusCode = _statusCode;
                return this;
            },
            json : obj=>{
                message = obj.message;
            }
        }
        is_auth(req,res);
        expect(statusCode).toBe(401);
        expect(message).toBeDefined();
    });

    it('should give the request a property of a userId if the token is succefully verified',function(){
        const req  = {
            get:headerName => 'Bearer xyz.xyz.xyz'
        };
        const next = jest.fn();
        const mockedJWTVerify = jest.spyOn(jwt,"verify").mockReturnValue({userId : 1});
        is_auth(req,{},next);
        expect(mockedJWTVerify).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        expect(req).toHaveProperty('userId',1);
        mockedJWTVerify.mockRestore();
    });
});