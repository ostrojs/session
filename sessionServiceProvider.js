const ServiceProvider = require('@ostro/support/serviceProvider');
const SessionManager = require('./sessionManager')
class SessionServiceProvider extends ServiceProvider {
    register() {
        this.registerSessionManager();
    }

    boot() {
        this.registerSessionDriver();
    }

    registerSessionManager() {
        this.$app.singleton('session', function(app) {
            return new SessionManager(app);
        });
    }

    registerSessionDriver() {
        this.$app.singleton('session.store', function(app) {
            return app.session.driver();
        });
    }

}
module.exports = SessionServiceProvider