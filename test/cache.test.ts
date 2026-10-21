const _CacheAdapter = require('../src/adapter/cache');
const CacheAdapter = _CacheAdapter.default || _CacheAdapter;

describe('adapter/cache', () => {
    test('initializes with checkPeriod from stores config or undefined', () => {
        const mockConn = {};
        const configWithPeriod = {
            driver: 'redis.cache',
            stores: {
                redis: { checkPeriod: 3600 }
            }
        };
        const adapter1 = new CacheAdapter(mockConn, configWithPeriod);
        expect(adapter1).toBeDefined();

        const configWithoutPeriod = {
            driver: 'memcached',
            stores: {
                memcached: 'not-an-object'
            }
        };
        const adapter2 = new CacheAdapter(mockConn, configWithoutPeriod);
        expect(adapter2).toBeDefined();
    });

    test('read parses JSON on resolve and returns error on reject', (done) => {
        const mockConn = {
            get: jest.fn((key) => {
                if (key === 'session.valid') {
                    return Promise.resolve(JSON.stringify({ user: 'Bob' }));
                }
                return Promise.reject(new Error('Cache miss'));
            })
        };
        const adapter = new CacheAdapter(mockConn, { driver: 'array', stores: { array: {} } });

        adapter.read('valid', (err, data) => {
            expect(err).toBeNull();
            expect(data).toEqual({ user: 'Bob' });

            adapter.read('invalid', (err2, data2) => {
                expect(err2).toBeDefined();
                expect(data2).toBeNull();
                done();
            });
        });
    });

    test('write puts data into cache and passes maxAge', (done) => {
        const mockConn = {
            put: jest.fn((key, data, maxAge) => {
                if (key === 'session.fail') {
                    return Promise.reject(new Error('Put failed'));
                }
                return Promise.resolve(true);
            })
        };
        const adapter = new CacheAdapter(mockConn, {
            driver: 'redis',
            stores: { redis: { checkPeriod: 120 } }
        });

        adapter.write('success', { hello: 'world' }, (err, res) => {
            expect(err).toBeNull();
            expect(res).toBe(true);
            expect(mockConn.put).toHaveBeenCalledWith('session.success', JSON.stringify({ hello: 'world' }), 120);

            adapter.write('fail', {}, (err2, res2) => {
                expect(err2).toBeDefined();
                expect(res2).toBeNull();
                done();
            });
        });
    });

    test('destroy calls forget on connection', (done) => {
        const mockConn = {
            forget: jest.fn((key) => {
                if (key === 'session.error') {
                    return Promise.reject(new Error('Forget failed'));
                }
                return Promise.resolve(true);
            })
        };
        const adapter = new CacheAdapter(mockConn, { driver: 'array', stores: { array: {} } });

        adapter.destroy('success', (err, res) => {
            expect(err).toBeNull();
            expect(res).toBe(true);

            adapter.destroy('error', (err2, res2) => {
                expect(err2).toBeDefined();
                expect(res2).toBe(false);
                done();
            });
        });
    });
});
