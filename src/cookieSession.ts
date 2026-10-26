import Jar from '@ostro/cookie/jar';
import Session from './session';
import uidSafeModule from 'uid-safe';
import csrfModule from 'csrf';
const uidSafe: any = uidSafeModule;
const csrfConstructor: any = csrfModule;
import Cookie from '@ostro/cookie/cookie';

const uid = uidSafe.sync;
const tokens = new csrfConstructor({
    saltLength: 30
});

/**
 * Class CookieSession handling session cookie lifecycle and request binding.
 */
class CookieSession {
    #store: any;
    #config: Record<string, any>;
    #cookie: any;
    #app: any;

    /**
     * Create a new CookieSession instance.
     *
     * @param $app - Application instance.
     * @param $config - Session configuration dictionary.
     * @param $store - Session store instance.
     */
    constructor($app: any, $config: Record<string, any>, $store: any) {
        this.#app = $app;
        this.#store = $store;
        this.#config = $config;
        this.#cookie = new Jar($app, $config);
    }

    /**
     * Get the underlying cookie jar (exposed for testing/integration).
     *
     * @returns Cookie Jar instance.
     */
    public getCookieJar(): any {
        return this.#cookie;
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
            cookies = this.#cookie.getCookies(headerCookies);
            if (cookies) {
                const secret = this.#config['key'] || this.#app?.['config']?.get?.('app.key') || this.#app?.['config']?.['app']?.['key'];
                cookies = this.#cookie.getSignedCookies(cookies, secret);
            }
        }
        let rawSid = (cookies || {})[this.#config['cookie']];
        if (typeof rawSid === 'string' && rawSid.startsWith('s:')) {
            const secret = this.#config['key'] || this.#app?.['config']?.get?.('app.key') || this.#app?.['config']?.['app']?.['key'];
            const unsigned = this.#cookie.getSignedCookies({ [this.#config['cookie']]: rawSid }, secret);
            rawSid = unsigned[this.#config['cookie']] || rawSid;
        }
        const sid: string = this.#getSessionId(rawSid);
        this.#store.read(sid, (err: any, data: any) => {
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
    #getSessionId(id?: any): string {
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
        response.append('Set-Cookie', this.#cookie.createCookies(this.#config['cookie'], String(val), {
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
            __token: tokens.create(this.#config['key']),
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
        this.#store.write(sessionId, __attributes, cb);
    }

    /**
     * Destroy session data in store.
     *
     * @param sessionId - Session ID.
     * @param cb - Completion callback.
     */
    destroy(sessionId: string, cb?: (err: any) => void): void {
        this.#store.destroy(sessionId, cb);
    }
}

export default CookieSession;
