import { describe, test, expect, jest } from "@jest/globals";
const _StartSessionMiddleware = require('../src/middleware/startSession');
const StartSessionMiddleware = _StartSessionMiddleware.default || _StartSessionMiddleware;
const _SessionManager = require('../src/sessionManager');
const SessionManager = _SessionManager.default || _SessionManager;

describe('middleware/startSession', () => {
    test('when $app.session is an instance of SessionManager, initializes startSession and handles request', () => {
        const mockManager = Object.create(SessionManager.prototype);
        const mockStartSession = jest.fn((req, res, next) => next());
        mockManager.start = jest.fn(() => mockStartSession);

        StartSessionMiddleware.prototype.$app = {
            session: mockManager
        };

        const middleware = new StartSessionMiddleware();

        expect(middleware.$registered).toBe(true);
        expect(middleware.startSession).toBe(mockStartSession);

        const req = {};
        const res = {};
        const next = jest.fn();

        middleware.handle({ request: req, response: res, next });
        expect(mockStartSession).toHaveBeenCalledWith(req, res, next);
    });

    test('when $app.session is not an instance of SessionManager, handle calls next directly', () => {
        StartSessionMiddleware.prototype.$app = {
            session: null
        };

        const middleware = new StartSessionMiddleware();

        expect(middleware.$registered).toBeUndefined();

        const req = {};
        const res = {};
        const next = jest.fn();

        middleware.handle({ request: req, response: res, next });
    });
});
