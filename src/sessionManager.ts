import SessionStarter from './sessionStarter';
import CookieSession from './cookieSession';
import SessionStore from './sessionStore';
import Manager from '@ostro/support/manager';
import { ucfirst } from '@ostro/support/string';
import MemoryAdapter from './adapter/memory';
import FileAdapter from './adapter/file';
import DatabaseAdapter from './adapter/database';
import CacheAdapter from './adapter/cache';

/**
 * Class SessionManager.
 */
class SessionManager extends Manager {

    public $type: string = 'session';

    /**
     * getSessionConfig method.
     * @returns {any}
     */
    public getSessionConfig(): any {
        return this.$config[this.$type];
    }

    /**
     * config method.
     * @returns {any}
     */
    public config(): any {
        const sessionConfig = this.getSessionConfig();
        return {
            ...sessionConfig,
            key: (this.$config['app'] && this.$config['app']['key']) || 'a@jf#H&5@6*1jV(>df6d!fk8^6g56%tt+b4'
        };
    }

    /**
     * start method.
     * @returns {any}
     */
    public start(): any {
        return this.startSession(new SessionStarter(this.config(), new CookieSession(this.$container, this.config(), this.driver()), this.driver()));
    }
    
    /**
     * startSession method.
     * @param session
     * @returns {any}
     */
    public startSession(session: any): (request: any, response: any, next: (err?: any) => void) => void {
        return (request: any, response: any, next: (err?: any) => void) => {
            session.start(request, response, next);
        };
    }

    /**
     * resolve method.
     * @param name
     * @returns {any}
     */
    public resolve(name: string): any {
        const config = this.getSessionConfig();
        if (this.$customCreators[this.getDriverName()]) {
            return this.callCustomCreator(config, name);
        }
        const driverName = this.getDriverName().split('.');
        const driverMethod = 'create' + ucfirst(driverName[0]) + 'Driver';
        if (driverMethod in this) {
            return ((this as Record<string, Function>)[driverMethod])(config, driverName);
        } else {
            throw new Error(`Driver [${this.getDriverName()}] is not supported.`);
        }
    }

    /**
     * callCustomCreator method.
     * @param $config
     * @param name
     * @returns {any}
     */
    public callCustomCreator($config: Record<string, any>, name: string): any {
        const driver = this.$customCreators[this.getDriverName()](this.$constraints, name, $config);
        return this.adapt(driver);
    }

    /**
     * createMemoryDriver method.
     * @param $config
     * @returns {any}
     */
    public createMemoryDriver($config: Record<string, any>): any {
        return this.adapt(new MemoryAdapter($config['files']));
    }

    /**
     * createFileDriver method.
     * @param $config
     * @returns {any}
     */
    public createFileDriver($config: Record<string, any>): any {
        return this.adapt(new FileAdapter($config['files']));
    }

    /**
     * createDatabaseDriver method.
     * @param $config
     * @returns {any}
     */
    public createDatabaseDriver($config: Record<string, any>): any {
        return this.adapt(new DatabaseAdapter(this.$container.db, $config['table']));
    }

    /**
     * createCacheDriver method.
     * @param $config
     * @param driver
     * @returns {any}
     */
    public createCacheDriver($config: Record<string, any>, driver: any): any {
        return this.adapt(new CacheAdapter(this.$container.cache.driver(driver[1]), $config));
    }

    /**
     * adapt method.
     * @param session
     * @returns {any}
     */
    public adapt(session: any): any {
        return new SessionStore(session);
    }

    /**
     * getDriverName method.
     * @returns {any}
     */
    public getDriverName(): string {
        return super.getConfig('driver');
    }

    /**
     * getDefaultDriver method.
     * @returns {any}
     */
    public getDefaultDriver(): string {
        return this.getDriverName();
    }
}

export default SessionManager;
