const kConnection: unique symbol = Symbol('connection');
const kMaxAge: unique symbol = Symbol('maxAge');

/**
 * Class Cache session storage adapter.
 */
class Cache {
    [kConnection]: any;
    [kMaxAge]: number | undefined;

    /**
     * Create a new instance.
     *
     * @param connection - Cache repository or store instance.
     * @param $config - Session configuration dictionary.
     */
    constructor(connection: any, $config: Record<string, any>) {
        this[kConnection] = connection;
        const driverOptions: any = $config.stores[$config['driver'].split('.')[0]];
        this[kMaxAge] = typeof driverOptions === 'object' ? driverOptions.checkPeriod : undefined;
    }

    /**
     * Read session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Callback receiving error or data.
     */
    read(sid: string, cb: (err: any, data?: any) => void): void {
        this[kConnection].get('session.' + sid).then((res: any) => {
            cb(null, JSON.parse(res));
        }).catch((err: any) => {
            cb(err, null);
        });
    }

    /**
     * Write session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param data - Session attributes.
     * @param cb - Callback receiving error or result.
     */
    write(sid: string, data: Record<string, any>, cb: (err: any, res?: any) => void): void {
        this[kConnection].put('session.' + sid, JSON.stringify(data), this[kMaxAge]).then((res: any) => {
            cb(null, res);
        }).catch(function (err: any) {
            cb(err, null);
        });
    }

    /**
     * Destroy session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Callback receiving error or success boolean.
     */
    destroy(sid: string, cb: (err: any, success?: boolean) => void): void {
        this[kConnection].forget('session.' + sid).then((res: any) => {
            cb(null, true);
        }).catch((err: any) => {
            cb(err, false);
        });
    }
}

export default Cache;