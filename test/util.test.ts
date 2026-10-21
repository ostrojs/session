const _util = require('../src/util');
const util = _util.default || _util;

describe('util', () => {
    describe('defineMember', () => {
        test('defines nested member on object', () => {
            const obj = {};
            util.defineMember(obj, 'a.b.c');
            expect(obj.a).toBeDefined();
            expect(obj.a.b).toBeDefined();
            expect(typeof obj.a.b).toBe('object');
        });

        test('preserves existing object path and overwrites non-object', () => {
            const obj = { a: { b: 123 } };
            util.defineMember(obj, 'a.b.c');
            expect(typeof obj.a.b).toBe('object');
        });

        test('handles single level name without loops', () => {
            const obj = {};
            util.defineMember(obj, 'single');
            expect(obj).toEqual({});
        });
    });

    describe('compileTrust', () => {
        test('returns function as-is if function provided', () => {
            const fn = () => true;
            expect(util.compileTrust(fn)).toBe(fn);
        });

        test('returns function that returns true when true is passed', () => {
            const compiled = util.compileTrust(true);
            expect(typeof compiled).toBe('function');
            expect(compiled('127.0.0.1', 0)).toBe(true);
        });

        test('returns function checking index when number is passed', () => {
            const compiled = util.compileTrust(2);
            expect(typeof compiled).toBe('function');
            expect(compiled('127.0.0.1', 0)).toBe(true);
            expect(compiled('127.0.0.1', 1)).toBe(true);
            expect(compiled('127.0.0.1', 2)).toBe(false);
        });

        test('compiles comma-separated string of trusted proxies', () => {
            const compiled = util.compileTrust('loopback, 192.168.1.1');
            expect(typeof compiled).toBe('function');
            expect(compiled('127.0.0.1', 0)).toBe(true);
        });

        test('compiles falsy / empty value', () => {
            const compiled = util.compileTrust(false);
            expect(typeof compiled).toBe('function');
            expect(compiled('127.0.0.1', 0)).toBe(false);
        });
    });
});
