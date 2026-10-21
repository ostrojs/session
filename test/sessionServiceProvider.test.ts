const _SessionServiceProvider = require('../src/sessionServiceProvider');
const SessionServiceProvider = _SessionServiceProvider.default || _SessionServiceProvider;
const _SessionManager = require('../src/sessionManager');
const SessionManager = _SessionManager.default || _SessionManager;

describe('SessionServiceProvider', () => {
    test('register binds session singleton', () => {
        const singletons = {};
        const mockApp = {
            singleton: jest.fn((name, callback) => {
                singletons[name] = callback;
            }),
            config: {
                get: jest.fn(() => ({}))
            }
        };

        const provider = new SessionServiceProvider(mockApp);
        provider.register();

        expect(mockApp.singleton).toHaveBeenCalledWith('session', expect.any(Function));
        const resolvedManager = singletons['session'](mockApp);
        expect(resolvedManager).toBeInstanceOf(SessionManager);
    });

    test('boot binds session.store singleton', () => {
        const singletons = {};
        const mockStore = { read: jest.fn() };
        const mockApp = {
            singleton: jest.fn((name, callback) => {
                singletons[name] = callback;
            }),
            session: {
                driver: jest.fn(() => mockStore)
            }
        };

        const provider = new SessionServiceProvider(mockApp);
        provider.boot();

        expect(mockApp.singleton).toHaveBeenCalledWith('session.store', expect.any(Function));
        const resolvedDriver = singletons['session.store'](mockApp);
        expect(resolvedDriver).toBe(mockStore);
        expect(mockApp.session.driver).toHaveBeenCalled();
    });
});
