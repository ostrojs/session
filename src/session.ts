import type { ISession } from '@ostro/contracts/session/session';
import SessionInterface from '@ostro/contracts/session/session';
import { isPlainObject, merge, get, set, isObject, omit, uniq, difference, isArray, intersection } from 'lodash';

class Session extends SessionInterface implements ISession {
    #sessionId: string;
    #handler: any;
    #attributes: Record<string, any>;
    #response: any;
    public existed: boolean = false;
    public touched: boolean = false;

    /**
     * Create a new session instance.
     *
     * @param handler - Session storage handler.
     * @param __attributes - Initial attributes or null.
     * @param sessionId - Session identifier.
     * @param response - Outgoing HTTP response.
     */
    constructor(handler: any, __attributes: any, sessionId: string, response: any) {
        super();
        this.#sessionId = sessionId;
        this.#handler = handler;
        this.#attributes = __attributes || handler.structureobject();
        this.#response = response;
        Object.defineProperties(this, {
            existed: {
                value: Boolean(__attributes)
            }
        });
        Object.defineProperty(this, 'touched', {
            value: Boolean((this.get('__flash.__old', []))?.length),
            writable: true
        });
    }

    /**
     * Get the session ID.
     *
     * @returns Current session ID.
     */
    public getId(): string {
        return this.#sessionId;
    }

    /**
     * Flush all attributes from the session.
     *
     * @returns Always returns true.
     */
    public flush(): boolean {
        this.touched = true;
        this.#attributes = this.#handler.structureobject();
        return true;
    }

    /**
     * Save the session attributes to storage.
     *
     * @param callback - Completion callback.
     */
    public save(callback: Function): void {
        this.get('__flash.__old', []).forEach((old: string) => {
            this.forget(old);
        });
        this.put('__flash.__old', this.get('__flash.__new', []));
        this.put('__flash.__new', []);
        this.#handler.write(this.#sessionId, this.#attributes, (err: any, data: any) => {
            callback(err, data);
        });
    }

    /**
     * Pull an attribute and remove it from the session.
     *
     * @typeParam T - Expected value type.
     * @param key - Attribute key.
     * @param defaultValue - Fallback value if not set.
     * @returns Pulled value or fallback.
     */
    public pull<T = unknown>(key: string, defaultValue?: T | null): T | null {
        if (this.#attributes[key]) {
            defaultValue = this.#attributes[key];
            delete this.#attributes[key];
            this.touched = true;
        }
        return defaultValue || null;
    }

    /**
     * Regenerate the CSRF token.
     */
    public regenerateToken(): void {
        this.put('__token', undefined);
    }

    /**
     * Remove an attribute from the session.
     *
     * @param $key - Attribute key.
     */
    public remove($key: string): void {
        this.pull($key);
    }

    /**
     * Push a value onto an array session attribute.
     *
     * @typeParam T - Value type.
     * @param key - Attribute key.
     * @param value - Value to push.
     */
    public push<T = unknown>(key: string, value: T): void {
        const array: any = this.get(key, []);
        if (isArray(array)) {
            array.push(value);
            this.put(key, array);
        }
    }

    /**
     * Merge values into an existing session attribute.
     *
     * @param key - Attribute key.
     * @param value - Value to merge.
     * @param defaultValue - Default fallback container.
     */
    public merge(key: string, value: any, defaultValue: Record<string, any> = {}): void {
        const data: any = this.get(key, defaultValue);
        if (isArray(data)) {
            this.put(key, data.concat(value));
        } else if (isPlainObject(data)) {
            this.put(key, merge(data, value));
        }
    }

    /**
     * Regenerate the session ID and optionally destroy old session.
     *
     * @param destroy - Whether to destroy old session data.
     * @param cb - Optional callback.
     */
    public regenerate(destroy: boolean, cb?: Function): void {
        if (destroy) {
            this.#handler.destroy(this.#sessionId, cb);
        }
        this.flush();
        this.#handler.generateSidToCookie(this.#response);
    }

    /**
     * Determine if an attribute exists in the session.
     *
     * @param key - Attribute key.
     * @returns True if attribute exists.
     */
    public has(key: string): boolean {
        return get(this.#attributes, key) != undefined;
    }

    /**
     * Forget an attribute from the session.
     *
     * @param key - Attribute key.
     */
    public forget(key: string): void {
        this.touched = true;
        delete this.#attributes[key];
    }

    /**
     * Get an attribute from the session.
     *
     * @typeParam T - Expected return type.
     * @param key - Attribute key.
     * @param defaultValue - Fallback default value.
     * @returns Attribute value or fallback.
     */
    get<T = unknown>(key: string, defaultValue?: T | null): T | null {
        return get(this.#attributes, key) || defaultValue || null;
    }

    /**
     * Get all session attributes except token and flash metadata.
     *
     * @returns Dictionary of all attributes.
     */
    public all(): Record<string, any> {
        return omit(this.#attributes, ['_token', 'flash']);
    }

    /**
     * Put a key-value pair or dictionary into the session.
     *
     * @typeParam T - Value type.
     * @param key - Attribute key or key-value map.
     * @param value - Value to store when key is a string.
     */
    public put<T = unknown>(key: string | Record<string, any>, value?: T): void {
        if (!isObject(key)) {
            key = {
                [key as string]: value
            };
        }
        const targetKey = key as Record<string, any>;
        for (const objKey in targetKey) {
            if (Object.prototype.hasOwnProperty.call(targetKey, objKey)) {
                set(this.#attributes, objKey, targetKey[objKey]);
                this.touched = true;
            }
        }
    }

    /**
     * Flash a key-value pair or dictionary into the session.
     *
     * @typeParam T - Value type.
     * @param key - Attribute key or key-value map.
     * @param value - Value to store when key is a string.
     */
    public flash<T = unknown>(key: string | Record<string, any>, value?: T): void {
        if (!isObject(key)) {
            key = {
                [key as string]: value
            };
        }
        this.put(key);
        this.put('__flash.__new', uniq((this.get('__flash.__new', []) as string[]).concat(Object.keys(key))));
        this.put('__flash.__old', difference(this.get('__flash.__old', []) as string[], Object.keys(key)));
    }

    /**
     * Retain only specified flashed keys.
     *
     * @param keys - Keys to retain.
     */
    public flashOnly(keys: any): void {
        keys = Array.isArray(keys) ? keys : arguments;
        const onlyKeys = intersection(this.get('__flash.__new', []) as string[], keys);
        const exceptKeys = difference(this.get('__flash.__new', []) as string[], keys);
        for (const except of exceptKeys) {
            this.forget(except);
        }
        this.put('__flash.__new', onlyKeys);
        this.put('__flash.__old', difference(this.get('__flash.__old', []) as string[], keys));
    }

    /**
     * Flash all except specified keys.
     *
     * @param keys - Keys to exclude from flash.
     */
    public flashExcept(keys: any): void {
        keys = Array.isArray(keys) ? keys : arguments;
        const exceptKeys = intersection(this.get('__flash.__new', []) as string[], keys);
        const onlyKeys = difference(this.get('__flash.__new', []) as string[], keys);
        for (const except of exceptKeys) {
            this.forget(except);
        }
        this.put('__flash.__new', onlyKeys);
        this.put('__flash.__old', difference(this.get('__flash.__old', []) as string[], keys));
    }

    /**
     * Reflash all current flash data for another request.
     */
    public reflash(): void {
        this.put('__flash.__new', uniq((this.get('__flash.__new', []) as string[]).concat(this.get('__flash.__old', []) as string[])));
        this.put('__flash.__old', []);
    }

    /**
     * Keep specific or all flashed items.
     *
     * @param keys - Keys to keep.
     */
    public keep(keys: any): void {
        keys = isArray(keys) ? keys : Array.prototype.slice.call(arguments);
        this.put('__flash.__new', uniq((this.get('__flash.__new', []) as string[]).concat(keys)));
        this.put('__flash.__old', difference(this.get('__flash.__old', []) as string[], keys));
    }

    /**
     * Get the CSRF token.
     *
     * @returns CSRF token string or null.
     */
    public token(): string | null {
        return this.get('__token');
    }
}

export default Session;
