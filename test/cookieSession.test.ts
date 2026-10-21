const _CookieSession = require('../src/cookieSession');
const CookieSession = _CookieSession.default || _CookieSession;
const _Cookie = require('@ostro/cookie/cookie');
const Cookie = _Cookie.default || _Cookie;
const _SessionStore = require('../src/sessionStore');
const SessionStore = _SessionStore.default || _SessionStore;

describe('CookieSession', () => {
    let mockApp;
    let mockConfig;
    let mockStore;
    let cookieSession;

    beforeEach(() => {
        mockApp = {
            config: {
                app: {
                    key: 'app_secret_key_1234567890123456'
                },
                get: jest.fn(() => ({}))
            }
        };
        mockConfig = {
            cookie: 'ostro_session',
            key: 'app_secret_key_1234567890123456'
        };
        mockStore = {
            read: jest.fn((sid, cb) => cb(null, { test: 'data' })),
            write: jest.fn((sid, data, cb) => cb && cb(null, true)),
            destroy: jest.fn((sid, cb) => cb && cb(null, true))
        };
        cookieSession = new CookieSession(mockApp, mockConfig, mockStore);
    });

    test('structureobject returns object with token and empty flash', () => {
        const obj = cookieSession.structureobject();
        expect(obj.__token).toBeDefined();
        expect(obj.__flash).toEqual({ __old: [], __new: [] });
    });

    test('write and destroy delegate to store', (done) => {
        cookieSession.write('sid1', { a: 1 }, (err, res) => {
            expect(mockStore.write).toHaveBeenCalledWith('sid1', { a: 1 }, expect.any(Function));
            cookieSession.destroy('sid1', (err2, res2) => {
                expect(mockStore.destroy).toHaveBeenCalledWith('sid1', expect.any(Function));
                done();
            });
        });
    });

    test('generateSidToCookie appends signed Set-Cookie header to response', () => {
        const cookiesAppended = [];
        const mockResponse = {
            append: jest.fn((header, val) => {
                cookiesAppended.push({ header, val });
            }),
            request: {
                secure: () => true
            }
        };

        cookieSession.generateSidToCookie(mockResponse, 'custom-sid-12345');
        expect(mockResponse.append).toHaveBeenCalledWith(
            'Set-Cookie',
            expect.any(String)
        );

        // default val parameter
        cookieSession.generateSidToCookie(mockResponse);
        expect(mockResponse.append).toHaveBeenCalledTimes(2);
    });

    test('start with request.cookie as Cookie instance', (done) => {
        const signature = require('cookie-signature');
        const signedVal = 's:' + signature.sign('my_valid_session_id', 'app_secret_key_1234567890123456');

        const mockCookie = Object.create(Cookie.prototype);
        mockCookie.all = jest.fn(() => ({
            ostro_session: signedVal
        }));

        const req = {
            headers: {},
            cookie: mockCookie
        };
        const res = {
            request: {
                secure: () => false
            }
        };

        cookieSession.start(req, res, () => {
            expect(req.session).toBeDefined();
            expect(req.session.getId()).toBe('my_valid_session_id');
            expect(mockStore.read).toHaveBeenCalledWith('my_valid_session_id', expect.any(Function));
            done();
        });
    });

    test('start with header cookies and fallback when no valid sid is passed', (done) => {
        const req = {
            headers: {
                cookie: 'invalid_chars=@@@###$$$'
            }
        };
        const res = {
            request: {
                secure: () => false
            }
        };

        cookieSession.start(req, res, () => {
            expect(req.session).toBeDefined();
            // id should be regenerated via uid(30)
            expect(req.session.getId()).toBeDefined();
            expect(typeof req.session.getId()).toBe('string');
            done();
        });
    });

    test('start when cookies is null or empty', (done) => {
        const req = {
            headers: {}
        };
        const res = {
            request: {
                secure: () => false
            }
        };

        const kCookieSym = Object.getOwnPropertySymbols(cookieSession).find(s => s.description === 'cookie');
        const jar = cookieSession[kCookieSym];
        const origGetCookies = jar.getCookies;
        jar.getCookies = () => null;

        cookieSession.start(req, res, () => {
            expect(req.session).toBeDefined();
            jar.getCookies = origGetCookies;
            done();
        });
    });
});
