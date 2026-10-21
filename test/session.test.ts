const _Session = require('../src/session');
const Session = _Session.default || _Session;

describe('Session', () => {
    let mockHandler;
    let mockResponse;

    beforeEach(() => {
        mockHandler = {
            structureobject: jest.fn(() => ({
                __token: 'token123',
                __flash: {
                    __old: [],
                    __new: []
                }
            })),
            write: jest.fn((sid, attrs, cb) => cb(null, true)),
            destroy: jest.fn((sid, cb) => cb && cb(null, true)),
            generateSidToCookie: jest.fn()
        };
        mockResponse = {
            request: {
                secure: () => false
            }
        };
    });

    test('constructor initializes with default attributes when none provided', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        expect(session.getId()).toBe('sid_1');
        expect(session.existed).toBe(false);
        expect(session.touched).toBe(false);
        expect(session.token()).toBe('token123');
    });

    test('constructor sets touched to true when __flash.__old has elements', () => {
        const initialAttrs = {
            __token: 'token_old',
            __flash: {
                __old: ['flash_msg'],
                __new: []
            }
        };
        const session = new Session(mockHandler, initialAttrs, 'sid_2', mockResponse);
        expect(session.existed).toBe(true);
        expect(session.touched).toBe(true);
    });

    test('flush resets attributes to empty structure and marks touched', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('key', 'val');
        expect(session.flush()).toBe(true);
        expect(session.touched).toBe(true);
        expect(session.has('key')).toBe(false);
    });

    test('save cleans old flash, moves new to old, and writes through handler', (done) => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.flash('notice', 'Saved successfully');
        session.put('data', 'some data');

        session.save((err, data) => {
            expect(err).toBeNull();
            expect(mockHandler.write).toHaveBeenCalledWith('sid_1', expect.any(Object), expect.any(Function));

            // On a second save, old flash should be forgotten
            session.save((err2) => {
                expect(err2).toBeNull();
                expect(session.has('notice')).toBe(false);
                expect(session.has('data')).toBe(true);
                done();
            });
        });
    });

    test('pull retrieves and removes key and sets touched', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('username', 'Alice');
        expect(session.pull('username')).toBe('Alice');
        expect(session.has('username')).toBe(false);

        // pull non-existent key with default
        expect(session.pull('nonexistent', 'fallback')).toBe('fallback');
        // pull non-existent key without default
        expect(session.pull('nonexistent')).toBeNull();
    });

    test('regenerateToken updates __token', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.regenerateToken();
        expect(session.token()).toBeNull();
    });

    test('remove calls pull', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('item', 123);
        session.remove('item');
        expect(session.has('item')).toBe(false);
    });

    test('push appends element to array or creates it', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.push('items', 'item1');
        session.push('items', 'item2');
        expect(session.get('items')).toEqual(['item1', 'item2']);

        // push to non-array does not throw or push
        session.put('not_array', 'string');
        session.push('not_array', 'item');
        expect(session.get('not_array')).toBe('string');
    });

    test('merge handles array, plain object, and defaultValue', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('list', [1, 2]);
        session.merge('list', [3, 4]);
        expect(session.get('list')).toEqual([1, 2, 3, 4]);

        session.put('settings', { theme: 'dark' });
        session.merge('settings', { lang: 'en' });
        expect(session.get('settings')).toEqual({ theme: 'dark', lang: 'en' });

        // merge when key does not exist yet (defaults to {})
        session.merge('new_obj', { a: 1 });
        expect(session.get('new_obj')).toEqual({ a: 1 });
    });

    test('regenerate with destroy true and false', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        const cb = jest.fn();
        session.regenerate(true, cb);
        expect(mockHandler.destroy).toHaveBeenCalledWith('sid_1', cb);
        expect(mockHandler.generateSidToCookie).toHaveBeenCalledWith(mockResponse);

        session.regenerate(false);
        expect(mockHandler.generateSidToCookie).toHaveBeenCalledTimes(2);
    });

    test('has checks whether key exists', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('nested.key', 42);
        expect(session.has('nested.key')).toBe(true);
        expect(session.has('nested.missing')).toBe(false);
    });

    test('all returns attributes omitting _token and flash', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('user', 'Alice');
        const all = session.all();
        expect(all.user).toBe('Alice');
    });

    test('put supports object mapping and key/value pair', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put({ a: 1, b: 2 });
        expect(session.get('a')).toBe(1);
        expect(session.get('b')).toBe(2);
    });

    test('flash supports single key-value and object', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.flash('status', 'ok');
        expect(session.get('status')).toBe('ok');
        expect(session.get('__flash.__new')).toContain('status');

        session.flash({ alert: 'warn' });
        expect(session.get('alert')).toBe('warn');
        expect(session.get('__flash.__new')).toContain('alert');
    });

    test('flashOnly filters flash new keys', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.flash('k1', 'v1');
        session.flash('k2', 'v2');
        session.flash('k3', 'v3');

        // Pass array
        session.flashOnly(['k1', 'k2']);
        expect(session.has('k1')).toBe(true);
        expect(session.has('k2')).toBe(true);
        expect(session.has('k3')).toBe(false);

        // Pass arguments
        session.flash('k4', 'v4');
        session.flashOnly('k1');
        expect(session.has('k4')).toBe(false);
    });

    test('flashExcept filters out specified keys', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.flash('m1', 'v1');
        session.flash('m2', 'v2');

        session.flashExcept(['m1']);
        expect(session.has('m1')).toBe(false);
        expect(session.has('m2')).toBe(true);

        session.flash('m3', 'v3');
        session.flashExcept('m2');
        expect(session.has('m2')).toBe(false);
        expect(session.has('m3')).toBe(true);
    });

    test('reflash moves old flash to new', () => {
        const session = new Session(mockHandler, {
            __token: 't',
            __flash: {
                __old: ['prev_msg'],
                __new: ['curr_msg']
            }
        }, 'sid_1', mockResponse);

        session.reflash();
        expect(session.get('__flash.__new')).toEqual(['curr_msg', 'prev_msg']);
        expect(session.get('__flash.__old')).toEqual([]);
    });

    test('keep preserves specified flash keys', () => {
        const session = new Session(mockHandler, {
            __token: 't',
            __flash: {
                __old: ['k1', 'k2'],
                __new: []
            }
        }, 'sid_1', mockResponse);

        session.keep(['k1']);
        expect(session.get('__flash.__new')).toContain('k1');

        // keep with non-array arguments
        session.keep('k2');
        expect(session.get('__flash.__new')).toContain('k2');
    });

    test('merge ignores data that is neither array nor plain object', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        session.put('num', 123);
        session.merge('num', 456);
        expect(session.get('num')).toBe(123);
    });

    test('put skips prototype properties', () => {
        const session = new Session(mockHandler, null, 'sid_1', mockResponse);
        const proto = { inherited: 'val' };
        const obj = Object.create(proto);
        obj.own = 'ownVal';
        session.put(obj);
        expect(session.has('own')).toBe(true);
        expect(session.has('inherited')).toBe(false);
    });
});
