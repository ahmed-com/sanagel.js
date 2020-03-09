exports.errorCatcher = err=>{    
    console.log(err);
    const message = err.message || "UNEXPECTED ERROR";
    const status = err.status || 500;
    res.status(status).json({
        message 
    });
}

exports.throw400 = message=>{
	const err = new Error();
        err.message = message;
        err.status = 400;
        throw err;
}

exports.throw401 = message=>{
	const err = new Error();
        err.message = message;
        err.status = 401;
        throw err;
}

exports.throw404 = message=>{
	const err = new Error();
        err.message = message;
        err.status = 404;
        throw err;
}