const controller = require('../../../src/Controllers/publisher');
const {accessLevels} = require('../../../config/magicStrings.json');

let req, res, next;

beforeEach(()=>{
    const Publisher = jest.fn().mockReturnValue({
        subscribe                 : jest.fn(),
        forceSubscribe            : jest.fn(),
        unsubscribe               : jest.fn(),
        getSubscribers            : jest.fn().mockResolvedValue([]),
        emit                      : jest.fn(),
        leave                     : jest.fn(),
        join                      : jest.fn(),
        clearCache                : jest.fn(),
        getAccessLevel            : jest.fn().mockResolvedValue(false),
        isSubscriber              : jest.fn().mockResolvedValue(false),
        getRecordStatus           : jest.fn().mockResolvedValue(false),
        addReference              : jest.fn(),
        isHost                    : jest.fn().mockResolvedValue(false),
        createRecordWithReference : jest.fn().mockResolvedValue(1),
        removeReference           : jest.fn(),
        changeReference           : jest.fn(),
        getRecord                 : jest.fn().mockResolvedValue(undefined),
        getRecordsByRoom          : jest.fn().mockResolvedValue([]),
        updateRecord              : jest.fn(),
        deleteRecord              : jest.fn(),
        createNestedRoom          : jest.fn().mockResolvedValue(1),
        getNestedRooms            : jest.fn().mockResolvedValue([]),
        deleteRoom                : jest.fn(),
        updateRoom                : jest.fn(),
        getData                   : jest.fn().mockResolvedValue(undefined),
        exists                    : jest.fn().mockResolvedValue(false)
    });
    Publisher.getUserPublic            = jest.fn().mockResolvedValue(undefined);
    Publisher.getUserByMail            = jest.fn().mockResolvedValue(undefined);
    Publisher.getSocketId              = jest.fn().mockResolvedValue(null);
    Publisher.setSocketId              = jest.fn();
    Publisher.removeSocketId           = jest.fn();
    Publisher.clearCache               = jest.fn();
    Publisher.getRoomsByUser           = jest.fn().mockResolvedValue([]);
    Publisher.getRecordRelationCount   = jest.fn().mockResolvedValue(0);
    Publisher.upsertRecordStatus       = jest.fn();
    Publisher.getRecordsByUserRelation = jest.fn().mockResolvedValue([]);
    Publisher.getRecordsByAuthor       = jest.fn().mockResolvedValue([]);
    Publisher.getRecordsByUser         = jest.fn().mockResolvedValue([]);
    Publisher.createRoom               = jest.fn().mockResolvedValue(1);
    req = {
        Publisher,
        userId : 1,
        body : {}
    };
    res = {
        status : function(_statusCode){
            this.statusCode = _statusCode;
            return this;
        },
        json : jest.fn()
    };
    next = jest.fn();
});

afterEach(()=>{
    req = undefined;
    res = undefined;
    next = undefined;
});

describe('createRoom',()=>{
    it('should respond with 201, subscribe and join if no error was thrown',async function (){
        req.Publisher.getSocketId = jest.fn().mockResolvedValue('a');
        req.body.data = {"key" : "value"};

        await controller.createRoom(req,res,next);

        expect(res.statusCode).toBe(201);
        expect(res.json).toHaveBeenCalled();
        expect(req.Publisher.createRoom).toHaveBeenCalled();
        expect(req.Publisher().subscribe).toHaveBeenCalled();
        expect(req.Publisher.getSocketId).toHaveBeenCalled();
    });

    it('should forward a 500 if something goes wrong',async function(){
        req.Publisher().subscribe = jest.fn().mockImplementation(() => {
            throw new Error();
        });
        req.body.data = {"key" : "value"};

        await controller.createRoom(req,res,next);

        expect(next).toHaveBeenCalled();
    });
});

