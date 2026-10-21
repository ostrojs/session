import onHeaders from 'on-headers';
import SessionStoreException from './sessionStoreException';
import { random } from 'lodash';

const kStore: unique symbol = Symbol('store');
const kHandler: unique symbol = Symbol('handler');
const kConfig: unique symbol = Symbol('config');
const kCloseSession: unique symbol = Symbol('closeSession');

/**
 * Class SessionStarter orchestrating session start, response cookie writing, and auto-save.
 */
class SessionStarter {
    [kConfig]: Record<string, any>;
    [kHandler]: any;
    [kStore]: any;

    /**
     * Create a new SessionStarter instance.
     *
     * @param config - Session configuration dictionary.
     * @param handler - Session handler instance.
     * @param store - Session storage instance.
     */
    constructor(config: Record<string, any>, handler: any, store: any) {
        this[kConfig] = config;
        this[kHandler] = handler;
        this[kStore] = store;
    }

    /**
     * Intercept request and response to initialize and terminate session.
     *
     * @param request - Incoming HTTP request.
     * @param response - Outgoing HTTP response.
     * @param next - Next middleware callback.
     */
    start(request: any, response: any, next: (err?: any) => void): void {
        const end = response.end;
        let ended: boolean = false;
        onHeaders(response, () => {
            if (Object.prototype.hasOwnProperty.call(request, 'session')) {
                this[kHandler].generateSidToCookie(response, request.session.getId());
            }
        });

        response.end = (...argument: any[]) => {
            if ([404, 500].includes(response.statusCode)) {
                return end.apply(response, argument);
            }
            if (ended) {
                return;
            }
            ended = true;
            this[kCloseSession](request, response, (err: any) => {
                if (err) {
                    return next(new SessionStoreException(err));
                }
                end.apply(response, argument);
            });
        };
        this[kHandler].start(request, response, next);
    }

    /**
     * Close the session and save changes if modified.
     *
     * @param request - HTTP request.
     * @param response - HTTP response.
     * @param callback - Completion callback.
     */
    [kCloseSession](request: any, response: any, callback: (err?: any) => void): void {
        if (request.session.touched === true || (this[kConfig]['resave'] === true && request.session.existed === true) || (request.session.existed === false && this[kConfig]['saveUninitialized'] === true)) {
            request.session.save(callback);
        } else {
            callback(null);
        }
        this.collectGarbage();
    }

    /**
     * Clean up expired sessions from store if lottery hits.
     */
    public collectGarbage(): void {
        if (this.configHitsLottery()) {
            const period: number = parseInt(this[kConfig]['lifetime']) + 1;
            if (typeof this[kStore]['destroyExpireSession'] === 'function') {
                this[kStore].destroyExpireSession(period);
            }
        }
    }

    /**
     * Determine if lottery odds trigger garbage collection.
     *
     * @returns True if lottery succeeds.
     */
    public configHitsLottery(): boolean {
        return (random(1, this[kConfig]['lottery'][1]) <= this[kConfig]['lottery'][0]);
    }
}

export default SessionStarter;
