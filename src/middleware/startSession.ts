import SessionManager from '../sessionManager';

/**
 * Class startSession middleware.
 */
class startSession {
    declare $app: any;
    public $session: any;
    $registered?: boolean;
    startSession?: any;

    /**
     * Create a new startSession middleware instance.
     */
    constructor() {
        this.$session = (this as { $app?: { session?: unknown } }).$app?.session;
        if (this.$session instanceof SessionManager) {
            this.$registered = true;
            this.startSession = this.$session.start();
        }
    }

    /**
     * Handle incoming HTTP request.
     *
     * @param context - Request context containing request, response, and next.
     * @param context.request - Incoming HTTP request.
     * @param context.response - Outgoing HTTP response.
     * @param context.next - Next middleware callback.
     */
    handle({ request, response, next }: { request: any; response: any; next: (err?: any) => void }): void {
        if (!this.$registered) {
            return next();
        }
        this.startSession(request, response, next);
    }
}

export default startSession;