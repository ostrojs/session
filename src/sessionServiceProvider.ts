import ServiceProvider from '@ostro/support/serviceProvider';
import SessionManager from './sessionManager';

/**
 * Class SessionServiceProvider.
 */
class SessionServiceProvider extends ServiceProvider {
    /**
     * Register session services in container.
     */
    public register(): void {
        this.registerSessionManager();
    }

    /**
     * Boot session services.
     */
    public boot(): void {
        this.registerSessionDriver();
    }

    /**
     * Register SessionManager singleton.
     */
    public registerSessionManager(): void {
        this.$app.singleton('session', function (app: any) {
            return new SessionManager(app);
        });
    }

    /**
     * Register default session driver singleton.
     */
    public registerSessionDriver(): void {
        this.$app.singleton('session.store', function (app: any) {
            return app.session.driver();
        });
    }
}

export default SessionServiceProvider;