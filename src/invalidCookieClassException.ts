/**
 * Class InvalidCookieClassException.
 */
class InvalidCookieClassException {
    public name: string;
    public message: string;
    public statusCode: number;
    stack?: string;

    /**
     * Create a new instance.
     *
     * @param message - Exception message.
     */
    constructor(message: string) {
        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default InvalidCookieClassException;