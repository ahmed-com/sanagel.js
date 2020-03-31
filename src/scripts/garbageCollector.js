const pool = require('../utils/db');

exports.init = nameSpace=>{
    const nameSpaceERCs = `T${nameSpace}ERCs`;
    const nameSpaceRESCs = `T${nameSpace}RESCs`;
    setInterval(()=>{
        pool.myExecute(`DELETE ${nameSpaceERCs} FROM ${nameSpaceERCs} LEFT JOIN ${nameSpaceRESCs} ON ${nameSpaceERCs}.id = ${nameSpaceRESCs}.record WHERE ${nameSpaceRESCs}.room = :room`,{room : null});
    },3600000)//every hour
}