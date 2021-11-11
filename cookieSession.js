const Jar = require('@ostro/cookie/jar')
const session = require('./session')
const signature = require('cookie-signature');
const uid = require('uid-safe').sync
const tokens = require('csrf')({
    saltLength: 30
})
const kConfig = Symbol('config')
const kStore = Symbol('store')
const kGetSessionId = Symbol('getSessionId')
const kCookie = Symbol('cookie')
const Cookie = require('@ostro/cookie/cookie')
class CookieSession {
    constructor($app, $config, $store) {
        this[kStore] = $store;
        this[kConfig] = $config;
        this[kCookie] = new Jar($app, $config);
    }

    start(request, response, next) {
        let headerCookies = request.headers.cookie
        let cookies = null
        if (request.cookie instanceof Cookie) {
            cookies = request.cookie.all()
        } else {
            cookies = this[kCookie].getCookies(headerCookies)
        }
        if (cookies) {
            cookies = this[kCookie].getSignedCookies(cookies, this[kConfig]['key'])
        }
        let sid = this[kGetSessionId](cookies[this[kConfig]['cookie']])
        this[kStore].read(sid, (err, data) => {
            Object.defineProperty(request, 'session', {
                value: new session(this, data, sid, response),
                enumerable: true
            })
            next()
        })
    }

    [kGetSessionId](id) {
        if (!(typeof id === 'string' && /^[A-Za-z0-9-_]/.test(id))) {
            id = uid(30);
        }
        return id;
    }

    generateSidToCookie(response, val = uid(30)) {
        response.append('Set-Cookie', this[kCookie].createCookies(this[kConfig]['cookie'], String(val), {
            signed: true
        }, response.req.secure()));
    }

    structureobject() {
        return {
            __token: tokens.create(this[kConfig]['key']),
            __flash: {
                "__old": [],
                "__new": []
            }
        }
    }

    write(sessionId, __attributes, cb) {
        this[kStore].write(sessionId, __attributes, cb)
    }

    destroy(sessionId, cb) {
        this[kStore].destroy(sessionId, cb)
    }

}
module.exports = CookieSession