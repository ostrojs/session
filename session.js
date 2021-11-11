const { isPlainObject, merge, get, set, isObject, omit, uniq, difference, isArray } = require('lodash')
const SessionInterface = require('@ostro/contracts/session/session')
const uid = require('uid-safe').sync
const kAttributes = Symbol('attributes')
const kStore = Symbol('store')
const kSessionId = Symbol('sessionid')
const kResponse = Symbol('response')
const kHandler = Symbol('handler')

class Session extends SessionInterface {
    constructor(handler, __attributes, sessionId, response) {
        super()
        this[kSessionId] = sessionId
        Object.defineProperties(this, {
            [kHandler]: {
                value: handler
            },
            [kAttributes]: {
                value: __attributes || handler.structureobject(),
                writable: true,
                configurable: true
            },
            [kResponse]: {
                value: response
            },
            existed: { value: Boolean(__attributes) }
        })
        Object.defineProperty(this, 'touched', { value: Boolean((this.get('__flash.__old')).length), writable: true })
    }

    getId() {
        return this[kSessionId]
    }

    flush() {
        this.touched = true
        this[kAttributes] = this[kHandler].structureobject()
        return true;
    }

    save(callback) {

        this.get('__flash.__old', []).forEach((old) => {
            this.forget(old);
        });
        this.put('__flash.__old', this.get('__flash.__new', []));
        this.put('__flash.__new', []);
        this[kHandler].write(this[kSessionId], this[kAttributes], (err, data) => {
            callback(err, data)
        })

    }

    pull(key, defaultValue) {
        if (this[kAttributes][key]) {
            defaultValue = this[kAttributes][key];
            delete this[kAttributes][key]
            this.touched = true
        }
        return defaultValue || null;
    }

    regenerateToken() {
        this.put('__token', );
    }

    remove($key) {
        this.pull($key)
    }

    push(key, value) {
        var array = this.get(key, []);
        if (isArray(array)) {
            array.push(value);
            this.put(key, array);
        }
    }

    merge(key, value, defaultValue = {}) {
        var data = this.get(key, defaultValue);
        if (isArray(data)) {
            this.put(key, data.concat(value));
        } else if (isPlainObject(data)) {
            this.put(key, merge(data, value))
        }
    }

    regenerate(destroy, cb) {
        if (destroy) {
            this[kHandler].destroy(this[kSessionId], cb)
        }
        this.flush()
        this[kHandler].generateSidToCookie(this[kResponse])
    }

    has(key) {
        return get(this[kAttributes], key) != undefined;
    }

    forget(key) {
        this.touched = true
        delete this[kAttributes][key];
    }

    get(key, defaultValue) {
        return get(this[kAttributes], key) || defaultValue || null;
    }

    all() {
        return omit(this[kAttributes], ['_token', 'flash'])
    }

    put(key, value) {
        if (!isObject(key)) {
            key = {
                [key]: value
            };
        }
        for (let objKey in key) {
            if (key.hasOwnProperty(objKey)) {
                set(this[kAttributes], objKey, key[objKey])
                this.touched = true

            }
        }
    }

    flash(key, value) {
        if (!isObject(key)) {
            key = {
                [key]: value
            };
        }
        this.put(key);
        this.put('__flash.__new', (this.get('__flash.__new', [])).concat(Object.keys(key)));
        this.put('__flash.__old', difference(this.get('__flash.__old', []), Object.keys(key)));
    }

    reflash() {
        this.put('__flash.__new', uniq((this.get('__flash.__new', [])).concat(this.get('__flash.__old', []))));;
        this.put('__flash.__old', []);
    }

    keep(keys) {
        keys = isArray(keys) ? keys : Array.prototype.slice.call(arguments);
        this.put('__flash.__new', uniq(this.get('__flash.__new', []))).concat(keys);
        this.put('__flash.__old', difference(this.get('__flash.__old', []), key));
    }

    token() {
        return this.get('__token');
    }
}
module.exports = Session