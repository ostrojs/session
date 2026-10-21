const storage: Record<string, { updated_at: number; data: Record<string, any> }> = Object.create(null);

/**
 * Class Memory session storage adapter.
 */
class Memory {
    constructor(...args: any[]) {}
    /**
     * Read session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Callback receiving error or data.
     */
    read(sid: string, cb: (err: any, data?: any) => void): void {
        if (storage[sid]) {
            cb(null, storage[sid].data);
        } else {
            cb(true, null);
        }
    }

    /**
     * Write session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param data - Session attributes.
     * @param cb - Completion callback.
     */
    write(sid: string, data: Record<string, any>, cb: (err: any) => void): void {
        storage[sid] = {
            updated_at: Date.now(),
            data: data
        };
        cb(null);
    }

    /**
     * Destroy session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Completion callback.
     */
    destroy(sid: string, cb: (err: any) => void): void {
        if (storage[sid]) {
            delete storage[sid];
        }
        cb(null);
    }

    /**
     * Destroy expired sessions exceeding maxAge.
     *
     * @param maxAge - Maximum session age in minutes.
     */
    public destroyExpireSession(maxAge: number): void {
        Object.keys(storage).forEach(sid => {
            if (storage[sid].updated_at < (Date.now() - (maxAge * 60000))) {
                delete storage[sid];
            }
        });
    }
}

export default Memory;