import { describe, test, expect, beforeEach, jest } from "@jest/globals";
const _SessionStarter = require('../src/sessionStarter');
const SessionStarter = _SessionStarter.default || _SessionStarter;
const _SessionStoreException = require('../src/sessionStoreException');
const SessionStoreException = _SessionStoreException.default || _SessionStoreException;

describe('SessionStarter', () => {
    let mockConfig;
    let mockHandler;
    let mockStore;

    beforeEach(() => {
        mockConfig = {
            cookie: 'ostro_session',
            resave: false,
            saveUninitialized: false,
            lifetime: 120,
            lottery: [2, 100]
        };
        mockHandler = {
            start: jest.fn((req, res, next) => next()),
            generateSidToCookie: jest.fn()
        };
        mockStore = {
            destroyExpireSession: jest.fn()
        };
    });

    test('start delegates to handler.start and calls onHeaders callback when session property exists', (done) => {
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);

        const req = {
            session: {
                getId: () => 'my-sid-123',
                touched: false,
                existed: false
            }
        };
        const origEnd = jest.fn();
        const res = {
            statusCode: 200,
            end: origEnd,
            writeHead: jest.fn()
        };

        let capturedOnHeaders;
        const onHeaders = require('on-headers');
        jest.spyOn(require('on-headers'), 'apply');

        starter.start(req, res, () => {
            // trigger on-headers listener by writing head or emitting headers
            res.writeHead(200);
            expect(mockHandler.generateSidToCookie).toHaveBeenCalledWith(res, 'my-sid-123');

            // trigger end to trigger closeSession
            res.end('body');
            expect(origEnd).toHaveBeenCalledWith('body');
            done();
        });
    });

    test('onHeaders callback ignores when session property does not exist on request', (done) => {
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const req = {};
        const res = {
            statusCode: 200,
            end: jest.fn(),
            writeHead: jest.fn()
        };

        starter.start(req, res, () => {});
        res.writeHead(200);
        expect(mockHandler.generateSidToCookie).not.toHaveBeenCalled();
        done();
    });

    test('response.end bypasses session save when status is 404 or 500', () => {
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const origEnd = jest.fn();
        const res = {
            statusCode: 404,
            end: origEnd
        };
        const req = {
            session: { save: jest.fn() }
        };

        starter.start(req, res, () => {});
        res.end('Not Found');
        expect(origEnd).toHaveBeenCalledWith('Not Found');
        expect(req.session.save).not.toHaveBeenCalled();

        res.statusCode = 500;
        res.end('Server Error');
        expect(origEnd).toHaveBeenCalledWith('Server Error');
    });

    test('response.end ignores duplicate calls (ended guard)', () => {
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const origEnd = jest.fn();
        const res = {
            statusCode: 200,
            end: origEnd
        };
        const req = {
            session: {
                touched: false,
                existed: false
            }
        };

        starter.start(req, res, () => {});
        res.end('first');
        res.end('second');
        expect(origEnd).toHaveBeenCalledTimes(1);
    });

    test('closeSession saves session when touched is true', (done) => {
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const origEnd = jest.fn();
        const res = {
            statusCode: 200,
            end: origEnd
        };
        const req = {
            session: {
                touched: true,
                existed: false,
                save: jest.fn((cb) => cb(null))
            }
        };

        starter.start(req, res, () => {});
        res.end();
        setTimeout(() => {
            expect(req.session.save).toHaveBeenCalled();
            expect(origEnd).toHaveBeenCalled();
            done();
        }, 10);
    });

    test('closeSession saves session when resave is true and existed is true', (done) => {
        mockConfig.resave = true;
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const origEnd = jest.fn();
        const res = {
            statusCode: 200,
            end: origEnd
        };
        const req = {
            session: {
                touched: false,
                existed: true,
                save: jest.fn((cb) => cb(null))
            }
        };

        starter.start(req, res, () => {});
        res.end();
        setTimeout(() => {
            expect(req.session.save).toHaveBeenCalled();
            done();
        }, 10);
    });

    test('closeSession saves session when existed is false and saveUninitialized is true', (done) => {
        mockConfig.saveUninitialized = true;
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const origEnd = jest.fn();
        const res = {
            statusCode: 200,
            end: origEnd
        };
        const req = {
            session: {
                touched: false,
                existed: false,
                save: jest.fn((cb) => cb(null))
            }
        };

        starter.start(req, res, () => {});
        res.end();
        setTimeout(() => {
            expect(req.session.save).toHaveBeenCalled();
            done();
        }, 10);
    });

    test('closeSession forwards error as SessionStoreException to next when save fails', (done) => {
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        const origEnd = jest.fn();
        const res = {
            statusCode: 200,
            end: origEnd
        };
        const saveError = new Error('Disk full');
        const req = {
            session: {
                touched: true,
                save: jest.fn((cb) => cb(saveError))
            }
        };

        const next = (err) => {
            if (err) {
                expect(err).toBeInstanceOf(SessionStoreException);
                expect(err.errors).toBe(saveError);
                done();
            }
        };

        starter.start(req, res, next);
        res.end();
    });

    test('collectGarbage cleans up when lottery hits and store has destroyExpireSession', () => {
        mockConfig.lottery = [100, 100]; // guaranteed hit
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        starter.collectGarbage();
        expect(mockStore.destroyExpireSession).toHaveBeenCalledWith(121);
    });

    test('collectGarbage does nothing when lottery does not hit or store does not have destroyExpireSession', () => {
        mockConfig.lottery = [0, 100]; // never hit
        const starter = new SessionStarter(mockConfig, mockHandler, mockStore);
        starter.collectGarbage();
        expect(mockStore.destroyExpireSession).not.toHaveBeenCalled();

        // store without destroyExpireSession
        mockConfig.lottery = [100, 100];
        const starterWithoutGCOnStore = new SessionStarter(mockConfig, mockHandler, {});
        expect(() => starterWithoutGCOnStore.collectGarbage()).not.toThrow();
    });
});
