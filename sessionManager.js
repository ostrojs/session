require('@ostro/support/helpers')
const SessionStarter = require('./sessionStarter')
const InvalidCookieClassException = require('./invalidCookieClassException')
const CookieSession = require('./cookieSession')
const SessionStore = require('./sessionStore')
const Manager = require('@ostro/support/manager')

class SessionManager  extends Manager {

    $type = 'session';

    getSessionConfig() {
        return this.$config[this.$type]
    }

    config() {
        let sessionConfig = this.getSessionConfig()
        return {
            ...sessionConfig,
            key: this.$config['app']['key'] || 'a@jf#H&5@6*1jV(>df6d!fk8^6g56%tt+b4'
        }
    }

    start() {
        return this.startSession(new SessionStarter(this.config(), new CookieSession(this.$container, this.config(), this.driver()), this.driver()))
    }
    
    startSession(session) {
        return (request, response, next) => {
            session.start(request, response, next)
        }
    }

    resolve(name) {
        var config = this.getSessionConfig();
        if ((this.$customCreators[this.getDriverName()])) {
            return this.callCustomCreator(config, name);
        }
        var driverName = this.getDriverName().split('.')
        var driverMethod = 'create' + driverName[0].ucfirst() + 'Driver';
        if (isset(this[driverMethod])) {
            return this[driverMethod](config, driverName);
        } else {
            throw new Error(`Driver [${this.getDriverName()}] is not supported.`);
        }
    }

    callCustomCreator($config, name) {
        var driver = this.$customCreators[this.getDriverName()](this.$constraints, name, $config);
        return this.adapt($driver);
    }

    createMemoryDriver($config) {
        return this.adapt((new(require('./adapter/memory'))($config['files'])));
    }

    createFileDriver($config) {
        return this.adapt((new(require('./adapter/file'))($config['files'])))
    }

    createDatabaseDriver($config) {
        return this.adapt((new(require('./adapter/database'))(this.$container.database, $config['table'])))
    }

    createCacheDriver($config, driver) {
        return this.adapt((new(require('./adapter/cache'))(this.$container.cache.driver(driver[1]), $config)))
    }

    adapt(session) {
        return new SessionStore(session);
    }

    getDriverName() {
        return super.getConfig('driver');
    }

    getDefaultDriver() {
        return this.getDriverName();
    }
}

module.exports = SessionManager