const _SessionStore = require('../src/sessionStore');
const SessionStore = _SessionStore.default || _SessionStore;

describe('SessionStore', () => {
    test('proxies read, write, destroy, destroyExpireSession with default sid', (done) => {
        const mockStore = {
            read: jest.fn((sid, cb) => cb(null, { foo: 'bar' })),
            write: jest.fn((sid, data, cb) => cb(null, true)),
            destroy: jest.fn((sid, cb) => cb(null, true)),
            destroyExpireSession: jest.fn((maxAge) => {})
        };

        const store = new SessionStore(mockStore);

        store.read('sid123', (err, data) => {
            expect(mockStore.read).toHaveBeenCalledWith('sid123', expect.any(Function));
            expect(data).toEqual({ foo: 'bar' });
        });

        // test default sid = ''
        store.read(undefined, (err, data) => {
            expect(mockStore.read).toHaveBeenCalledWith('', expect.any(Function));
        });

        store.write('sid123', { test: 1 }, (err, res) => {
            expect(mockStore.write).toHaveBeenCalledWith('sid123', { test: 1 }, expect.any(Function));
        });

        store.write(undefined, { test: 2 }, (err, res) => {
            expect(mockStore.write).toHaveBeenCalledWith('', { test: 2 }, expect.any(Function));
        });

        store.destroy('sid123', (err, res) => {
            expect(mockStore.destroy).toHaveBeenCalledWith('sid123', expect.any(Function));
        });

        store.destroy(undefined, (err, res) => {
            expect(mockStore.destroy).toHaveBeenCalledWith('', expect.any(Function));
        });

        store.destroyExpireSession(120);
        expect(mockStore.destroyExpireSession).toHaveBeenCalledWith(120);

        done();
    });
});
