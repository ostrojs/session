var storage = Object.create(null)
class Memory {
    read(sid, cb) {

        if (storage[sid]) {
            cb(null, storage[sid].data)
        } else {
            cb(true, null)
        }
    }

    write(sid, data, cb) {
        storage[sid] = {
            updated_at: Date.now(),
            data: data
        }
        cb(null)
    }

    destroy(sid, cb) {
        if (storage[sid]) {
            delete storage[sid];
        }
        cb(null)
    }

    destroyExpireSession(maxAge) {
        Object.keys(storage).map(sid => {
            if (storage[sid].updated_at < (Date.now() - (maxAge*60000))) {
                delete storage[sid];
            }
        })
    };

}
module.exports = Memory