import fs from 'fs-extra';
import path from 'node:path';

/**
 * Class File session storage adapter.
 */
class File {
    #path: string;

    /**
     * Create a new instance.
     *
     * @param storagePath - Directory path for storing session files.
     */
    constructor(storagePath: string) {
        this.#path = storagePath;
        fs.mkdirSync(this.#path, {
            recursive: true
        });
    }

    /**
     * Read session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Callback receiving error or data.
     */
    read(sid: string, cb: (err: any, data?: any) => void): void {
        fs.readJson(path.join(this.#path, sid), cb);
    }

    /**
     * Write session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param data - Session attributes.
     * @param cb - Completion callback.
     */
    write(sid: string, data: Record<string, any>, cb: (err: any) => void): void {
        fs.writeJson(path.join(this.#path, sid), data, cb);
    }

    /**
     * Destroy session data for the given session ID.
     *
     * @param sid - Session ID.
     * @param cb - Completion callback.
     */
    destroy(sid: string, cb?: (err: any) => void): void {
        fs.unlink(path.join(this.#path, sid), function (err: any) {
            if (typeof cb === 'function') {
                cb(err);
            }
        });
    }

    /**
     * Destroy expired sessions exceeding maxAge.
     *
     * @param maxAge - Maximum session age in minutes.
     */
    public destroyExpireSession(maxAge: number): void {
        const self = this;
        fs.readdir(this.#path, (err: any, files: string[]) => {
            if (err || files.length === 0) {
                return;
            }
            files.forEach((file: string) => {
                if (file[0] !== '.') {
                    fs.stat(path.join(this.#path, file), function (statErr: any, stat: any) {
                        if (!statErr) {
                            if (stat.isFile() && ((new Date()).getTime() - stat.atime.getTime() > (maxAge * 60000))) {
                                self.destroy(file);
                            }
                        }
                    });
                }
            });
        });
    }
}

export default File;