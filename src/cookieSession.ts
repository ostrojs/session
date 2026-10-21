import Jar from '@ostro/cookie/jar';
import Session from './session';
import * as uidSafeModule from 'uid-safe';
const uidSafe: any = (uidSafeModule as any).default || uidSafeModule;
import * as csrfModule from 'csrf';
const csrfConstructor: any = (csrfModule as any).default || csrfModule;
import Cookie from '@ostro/cookie/cookie';

const uid = uidSafe.sync;
const tokens = new csrfConstructor({
    saltLength: 30
});

const kConfig: unique symbol = Symbol('config');
const kStore: unique symbol = Symbol('store');
const kGetSessionId: unique symbol = Symbol('getSessionId');
const kCookie: unique symbol = Symbol('cookie');

/**
 * Class CookieSession handling session cookie lifecycle and request binding.
 */
class CookieSession {
    [kStore]: any;
    [kConfig]: Record<string, any>;
    [kCookie]: any;

    /**
     * Create a new CookieSession instance.
     *
     * @param $app - Application instance.
     * @param $config - Session configuration dictionary.
     * @param $store - Session store instance.
     */
    constructor($app: any, $config: Record<string, any>, $store: any) {
        this[kStore] = $store;
        this[kConfig] = $config;
        this[kCookie] = new Jar($app, $config);
    }

    /**
     * Start the session and attach session instance to request.
     *
     * @param request - Incoming HTTP request.
     * @param response - Outgoing HTTP response.
     * @param next - Next middleware callback.
     */
    start(request: any, response: any, next: (err?: any) => void): void {
        const headerCookies: string | undefined = request.headers.cookie;
        let cookies: any = null;
        if (request.cookie instanceof Cookie) {
            cookies = request.cookie.all();
        } else {
            cookies = this[kCookie].getCookies(headerCookies);
        }
        if (cookies) {
            cookies = this[kCookie].getSignedCookies(cookies, this[kConfig]['key']);
        }
        const sid: string = this[kGetSessionId]((cookies || {})[this[kConfig]['cookie']]);
        this[kStore].read(sid, (err: any, data: any) => {
            Object.defineProperty(request, 'session', {
                value: new Session(this, data, sid, response),
                enumerable: true
            });
            next();
        });
    }

    /**
     * Validate or generate session ID.
     *
     * @param id - Candidate session ID.
     * @returns Validated session ID.
     */
    [kGetSessionId](id?: any): string {
        if (!(typeof id === 'string' && /^[A-Za-z0-9-_]/.test(id))) {
            id = uid(30);
        }
        return id;
    }

    /**
     * Generate session ID and append signed Set-Cookie header to response.
     *
     * @param response - HTTP response.
     * @param val - Session ID value.
     */
    generateSidToCookie(response: any, val: string = uid(30)): void {
        response.append('Set-Cookie', this[kCookie].createCookies(this[kConfig]['cookie'], String(val), {
            signed: true
        }, response.request.secure()));
    }

    /**
     * Generate default structure for a new session.
     *
     * @returns Default session structure object.
     */
    public structureobject(): { __token: string; __flash: { __old: string[]; __new: string[] } } {
        return {
            __token: tokens.create(this[kConfig]['key']),
            __flash: {
                "__old": [],
                "__new": []
            }
        };
    }

    /**
     * Write session attributes to store.
     *
     * @param sessionId - Session ID.
     * @param __attributes - Attributes to save.
     * @param cb - Completion callback.
     */
    write(sessionId: string, __attributes: any, cb?: (err: any, data?: any) => void): void {
        this[kStore].write(sessionId, __attributes, cb);
    }

    /**
     * Destroy session data in store.
     *
     * @param sessionId - Session ID.
     * @param cb - Completion callback.
     */
    destroy(sessionId: string, cb?: (err: any) => void): void {
        this[kStore].destroy(sessionId, cb);
    }
}

export default CookieSession;
