import { describe, test, expect, beforeEach, jest } from "@jest/globals";
const _SessionManager = require('../src/sessionManager');
const SessionManager = _SessionManager.default || _SessionManager;
const _SessionStore = require('../src/sessionStore');
const SessionStore = _SessionStore.default || _SessionStore;
const path = require('node:path');
const os = require('node:os');

describe('SessionManager', () => {
    let mockApp;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            app: {
                key: 'base64:mocksecretkey1234567890123456'
            },
            session: {
                driver: 'memory',
                cookie: 'ostro_session',
                files: path.join(os.tmpdir(), 'ostro-sessions-' + Date.now()),
                table: 'sessions',
                stores: {
                    redis: { checkPeriod: 120 }
                },
                lottery: [2, 100],
                lifetime: 120
            }
        };

        mockApp = {
            config: mockConfig,
            make: jest.fn((binding) => {
                if (binding === 'config') return mockConfig;
                return null;
            }),
            db: {
                table: jest.fn(() => ({}))
            },
            cache: {
                driver: jest.fn(() => ({
                    get: jest.fn(),
                    put: jest.fn()
                }))
            }
        };
    });

    test('config returns session configuration merged with app key', () => {
        const manager = new SessionManager(mockApp);
        const cfg = manager.config();
        expect(cfg.driver).toBe('memory');
        expect(cfg.key).toBe('base64:mocksecretkey1234567890123456');

        // fallback key when app.key is undefined
        delete mockApp.config.app.key;
        const manager2 = new SessionManager(mockApp);
        const cfg2 = manager2.config();
        expect(cfg2.key).toBe('a@jf#H&5@6*1jV(>df6d!fk8^6g56%tt+b4');
    });

    test('getDefaultDriver returns driver name from config', () => {
        const manager = new SessionManager(mockApp);
        expect(manager.getDefaultDriver()).toBe('memory');
    });

    test('driver resolves memory driver', () => {
        const manager = new SessionManager(mockApp);
        const store = manager.driver();
        expect(store).toBeInstanceOf(SessionStore);
    });

    test('driver resolves file driver', () => {
        mockApp.config.session.driver = 'file';
        const manager = new SessionManager(mockApp);
        const store = manager.driver();
        expect(store).toBeInstanceOf(SessionStore);
    });

    test('driver resolves database driver', () => {
        mockApp.config.session.driver = 'database';
        const manager = new SessionManager(mockApp);
        const store = manager.driver();
        expect(store).toBeInstanceOf(SessionStore);
    });

    test('driver resolves cache driver with driver sub-name', () => {
        mockApp.config.session.driver = 'cache.redis';
        const manager = new SessionManager(mockApp);
        const store = manager.driver();
        expect(store).toBeInstanceOf(SessionStore);
        expect(mockApp.cache.driver).toHaveBeenCalledWith('redis');
    });

    test('driver calls custom creator when registered', () => {
        mockApp.config.session.driver = 'custom';
        const manager = new SessionManager(mockApp);
        const mockCustomStore = {
            read: jest.fn(),
            write: jest.fn(),
            destroy: jest.fn()
        };
        manager.extend('custom', (constraints, name, config) => {
            return mockCustomStore;
        });

        const store = manager.driver();
        expect(store).toBeInstanceOf(SessionStore);
    });

    test('driver throws error when driver is not supported', () => {
        mockApp.config.session.driver = 'unsupported_driver';
        const manager = new SessionManager(mockApp);
        expect(() => manager.driver()).toThrow('Driver [unsupported_driver] is not supported.');
    });

    test('start returns middleware handler and starts session flow', (done) => {
        const manager = new SessionManager(mockApp);
        const middleware = manager.start();
        expect(typeof middleware).toBe('function');

        const req = { headers: {} };
        const res = {
            statusCode: 200,
            end: jest.fn(),
            writeHead: jest.fn()
        };
        const next = jest.fn(() => done());

        middleware(req, res, next);
    });
});
