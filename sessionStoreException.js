class SessionStoreException{
    constructor(err) {
        this.name = this.constructor.name;
        this.message =  'Unable to store session';
        this.errors =  err;
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);

    }
}

module.exports= SessionStoreException