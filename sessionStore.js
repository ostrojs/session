const kStore = Symbol('store')
class SessionStore {
    constructor($store) {
        this[kStore] = $store
    }
    read(sid = '', cb) {
        this[kStore].read(sid, cb)
    }
    write(sid = '', data, cb) {
        this[kStore].write(sid, data, cb)

    }
    destroy(sid = '', cb) {
        this[kStore].destroy(sid, cb)

    }
    destroyExpireSession(maxAge) {
        this[kStore].destroyExpireSession(maxAge)

    };
}
module.exports = SessionStore