const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let db;

const mongoConnect = callback=>{    
    MongoClient.connect(process.env.MONGOURL)
    .then(client=>{
        console.log('connected to mongo');
        db = client.db('ANS');
        callback();
    })
    .catch(err=>{
        console.log(err);
        throw err;
    });
}

const getDb = ()=>{
    if(db){
        return db;
    }else{
        throw new Error('No database was found');
    }
}

exports.getDb = getDb;
exports.mongoConnect = mongoConnect;