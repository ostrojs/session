import onHeaders from 'on-headers';
import SessionStoreException from './sessionStoreException';
import { random } from 'lodash';

/**
 * Class SessionStarter orchestrating session start, response cookie writing, and auto-save.
 */
class SessionStarter {
    #config: Record<string, any>;
    #handler: any;
    #store: any;

    /**
     * Create a new SessionStarter instance.
     *
     * @param config - Session configuration dictionary.
     * @param handler - Session handler instance.
     * @param store - Session storage instance.
     */
    constructor(config: Record<string, any>, handler: any, store: any) {
        this.#config = config;
        this.#handler = handler;
        this.#store = store;
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
                this.#handler.generateSidToCookie(response, request.session.getId());
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
            this.#closeSession(request, response, (err: any) => {
                if (err) {
                    return next(new SessionStoreException(err));
                }
                end.apply(response, argument);
            });
        };
        this.#handler.start(request, response, next);
    }

    /**
     * Close the session and save changes if modified.
     *
     * @param request - HTTP request.
     * @param response - HTTP response.
     * @param callback - Completion callback.
     */
    #closeSession(request: any, response: any, callback: (err?: any) => void): void {
        if (request.session.touched === true || (this.#config['resave'] === true && request.session.existed === true) || (request.session.existed === false && this.#config['saveUninitialized'] === true)) {
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
            const period: number = parseInt(this.#config['lifetime']) + 1;
            if (typeof this.#store['destroyExpireSession'] === 'function') {
                this.#store.destroyExpireSession(period);
            }
        }
    }

    /**
     * Determine if lottery odds trigger garbage collection.
     *
     * @returns True if lottery succeeds.
     */
    public configHitsLottery(): boolean {
        return (random(1, this.#config['lottery'][1]) <= this.#config['lottery'][0]);
    }
}

export default SessionStarter;
