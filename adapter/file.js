const fs = require('fs-extra')
const path = require('path')
const kPath = Symbol('path')
class File {
    constructor(path) {
        this[kPath] = path;
        fs.mkdirSync(this[kPath], {
            recursive: true
        })
    }

    read(sid, cb) {
        fs.readJson(path.join(this[kPath], sid), cb)
    }

    write(sid, data, cb) {
        fs.writeJson(path.join(this[kPath], sid), data, cb)
    }

    destroy(sid, cb) {
        fs.unlink(path.join(this[kPath], sid), function(err) {
            if (typeof cb == 'function') {
                cb(err)
            }
        })
    }

    destroyExpireSession(maxAge) {
        var self = this;
        fs.readdir(this[kPath], (err, files) => {
            if (err || files.length === 0) {
                return;
            }
            files.forEach((file) => {
                if (file[0] != '.') {
                    fs.stat(path.join(this[kPath], file), function(err, stat) {
                        if (!err) {
                            if (stat.isFile() && ((new Date()).getTime() - stat.atime.getTime() > (maxAge*60000))) {
                                self.destroy(file);
                            }
                        }
                    });
                }
            });
        });
    };

}
module.exports = File