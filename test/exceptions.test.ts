import { describe, test, expect } from "@jest/globals";
const _InvalidCookieClassException = require('../src/invalidCookieClassException');
const InvalidCookieClassException = _InvalidCookieClassException.default || _InvalidCookieClassException;
const _SessionStoreException = require('../src/sessionStoreException');
const SessionStoreException = _SessionStoreException.default || _SessionStoreException;

describe('Session Exceptions', () => {
    test('InvalidCookieClassException creates error with message and status 500', () => {
        const err = new InvalidCookieClassException('Cookie class is invalid');
        expect(err.name).toBe('InvalidCookieClassException');
        expect(err.message).toBe('Cookie class is invalid');
        expect(err.statusCode).toBe(500);
        expect(err.stack).toBeDefined();
    });

    test('SessionStoreException creates error with cause and status 500', () => {
        const innerErr = new Error('Disk full');
        const err = new SessionStoreException(innerErr);
        expect(err.name).toBe('SessionStoreException');
        expect(err.message).toBe('Unable to store session');
        expect(err.errors).toBe(innerErr);
        expect(err.statusCode).toBe(500);
        expect(err.stack).toBeDefined();
    });
});
