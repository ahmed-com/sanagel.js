
exports.throw400 = message=>{
	const err = new Error();
        err.message = message;
        err.status = 400;
        throw err;
}

exports.throw403 = message=>{
	const err = new Error();
        err.message = message;
        err.status = 403;
        throw err;
}

exports.throw404 = message=>{
	const err = new Error();
        err.message = message;
        err.status = 404;
        throw err;
}