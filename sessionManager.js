require('@ostro/support/helpers')
const SessionStarter = require('./sessionStarter')
const InvalidCookieClassException = require('./invalidCookieClassException')
const CookieSession = require('./cookieSession')
const SessionStore = require('./sessionStore')
const kApp = Symbol('app')
const kDrivers = Symbol('drivers')
const kCustomCreators = Symbol('customCreators')
class SessionManager {

    constructor(app) {
        Object.defineProperties(this, {
            [kApp]: {
                value: app,
            },
            [kDrivers]: {
                value: {},
                writable: true,
            },
            [kCustomCreators]: {
                value: {},
                writable: true,
            }
        })
    }

    driver() {
        return this.get(this.getDriverName())
    }

    getSessionConfig() {
        return this[kApp]['config']['session']
    }

    config() {
        let sessionConfig = this.getSessionConfig()
        return {
            ...sessionConfig,
            key: this[kApp]['config']['app']['key'] || 'a@jf#H&5@6*1jV(>df6d!fk8^6g56%tt+b4'
        }
    }

    get(name) {
        return this[kDrivers][name] || this.resolve(name);
    }

    start() {
        return this.startSession(new SessionStarter(this.config(), new CookieSession(this[kApp], this.config(), this.driver()), this.driver()))
    }
    
    startSession(session) {

        return (request, response, next) => {
            session.start(request, response, next)
        }
    }

    resolve(name) {
        var config = this.getSessionConfig();
        if ((this[kCustomCreators][this.getDriverName()])) {
            return this.callCustomCreator(config);
        }
        var driverName = this.getDriverName().split('.')
        var driverMethod = 'create' + driverName[0].ucfirst() + 'Driver';
        if (this[driverMethod]) {
            return this[driverMethod](config, driverName);
        } else {
            throw new Error(`Driver [${this.getDriverName()}] is not supported.`);
        }
    }

    callCustomCreator($config) {
        var driver = this[kCustomCreators][this.getDriverName()](this[kApp]['config'], $config);
        return this.adapt($driver);
    }

    createMemoryDriver($config) {
        return this.adapt((new(require('./adapter/memory'))($config['files'])));
    }

    createFileDriver($config) {
        return this.adapt((new(require('./adapter/file'))($config['files'])))
    }

    createDatabaseDriver($config) {
        return this.adapt((new(require('./adapter/database'))(this[kApp].database, $config['table'])))
    }

    createCacheDriver($config, driver) {
        return this.adapt((new(require('./adapter/cache'))(this[kApp].cache.driver(driver[1]), $config)))
    }

    adapt(session) {
        return new SessionStore(session);
    }

    createSession(adapter) {
        return adapter;
    }

    set($name, $driver) {
        this[kDrivers][$name] = $driver;
        return this;
    }

    getConfig(name) {
        return this.getSessionConfig()[name];
    }

    getDriverName() {
        return this.getSessionConfig()['driver'];
    }
}

module.exports = SessionManager