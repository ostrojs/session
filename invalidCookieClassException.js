class InvalidCookieClassException {
    constructor(message) {
        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);

    }
}

module.exports = InvalidCookieClassException