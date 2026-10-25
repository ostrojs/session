/**
 * Class Database session storage adapter.
 */
class Database {
    #connection: any;
    #table: string;

    /**
     * Create a new instance.
     *
     * @param connection - Database connection instance.
     * @param table - Database table name.
     */
    constructor(connection: any, table: string) {
        this.#connection = connection;
        this.#table = table;
    }

    /**
     * Read session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Callback receiving error or data.
     */
    read(sid: string, cb: (err: any, data?: any) => void): void {
        this.#connection.table(this.#table).where({ sid }).value('payload').then((res: any) => {
            cb(null, (res ? JSON.parse(res) : null));
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
        this.#connection.table(this.#table).updateOrInsert({ sid }, { payload: JSON.stringify(data) }).then((res: any) => {
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
        this.#connection.table(this.#table).where({ sid }).delete().then((res: any) => {
            cb(null, true);
        }).catch((err: any) => {
            cb(err, false);
        });
    }
}

export default Database;
