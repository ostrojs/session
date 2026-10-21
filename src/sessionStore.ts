const kStore: unique symbol = Symbol('store');

/**
 * Class SessionStore.
 */
class SessionStore {
    [kStore]: any;

    /**
     * Create a new instance.
     *
     * @param $store - Underlying session storage adapter.
     */
    constructor($store: any) {
        this[kStore] = $store;
    }

    /**
     * Read session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Callback receiving error and data.
     */
    read(sid: string = '', cb: (err: any, data?: any) => void): void {
        this[kStore].read(sid, cb);
    }

    /**
     * Write session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param data - Session attributes map.
     * @param cb - Completion callback.
     */
    write(sid: string = '', data: Record<string, any>, cb: (err?: any) => void): void {
        this[kStore].write(sid, data, cb);
    }

    /**
     * Destroy session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Completion callback.
     */
    destroy(sid: string = '', cb: (err?: any) => void): void {
        this[kStore].destroy(sid, cb);
    }

    /**
     * Destroy expired sessions exceeding maxAge.
     *
     * @param maxAge - Maximum session age in minutes.
     */
    public destroyExpireSession(maxAge: number): void {
        this[kStore].destroyExpireSession(maxAge);
    }
}

export default SessionStore;