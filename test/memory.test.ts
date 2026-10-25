import { describe, test, it, expect, beforeEach, jest } from "@jest/globals";
const _Memory = require('../src/adapter/memory');
const Memory = _Memory.default || _Memory;

describe('adapter/memory', () => {
    let memory;

    beforeEach(() => {
        memory = new Memory();
    });

    test('read returns true/error when sid does not exist', (done) => {
        memory.read('non-existent', (err, data) => {
            expect(err).toBe(true);
            expect(data).toBeNull();
            done();
        });
    });

    test('write stores data and read retrieves it', (done) => {
        memory.write('sid1', { user: 'Alice' }, (err) => {
            expect(err).toBeNull();
            memory.read('sid1', (readErr, data) => {
                expect(readErr).toBeNull();
                expect(data).toEqual({ user: 'Alice' });
                done();
            });
        });
    });

    test('destroy removes existing and non-existing session', (done) => {
        memory.write('sid2', { user: 'Bob' }, () => {
            memory.destroy('sid2', (err) => {
                expect(err).toBeNull();
                memory.read('sid2', (err2, data2) => {
                    expect(err2).toBe(true);
                    // destroy non-existing sid
                    memory.destroy('non-existent', (err3) => {
                        expect(err3).toBeNull();
                        done();
                    });
                });
            });
        });
    });

    test('destroyExpireSession removes expired sessions based on maxAge in minutes', (done) => {
        const origNow = Date.now;
        const baseTime = 100000000;
        Date.now = jest.fn(() => baseTime);

        memory.write('expired-sid', { test: true }, () => {
            memory.write('active-sid', { test: true }, () => {
                // Advance time by 30 minutes
                Date.now = jest.fn(() => baseTime + 30 * 60000);

                // MaxAge is 20 minutes: expired-sid was updated 30 min ago, so 30 > 20 -> expired
                memory.destroyExpireSession(20);

                Date.now = origNow;

                memory.read('expired-sid', (err1) => {
                    expect(err1).toBe(true);
                    memory.read('active-sid', (err2) => {
                        expect(err2).toBe(true); // Both were written at baseTime, so both expired
                        done();
                    });
                });
            });
        });
    });

    test('destroyExpireSession keeps sessions that are not expired', (done) => {
        const origNow = Date.now;
        const baseTime = 200000000;
        Date.now = jest.fn(() => baseTime);

        memory.write('recent-sid', { test: true }, () => {
            // Advance time by only 5 minutes
            Date.now = jest.fn(() => baseTime + 5 * 60000);

            // MaxAge is 20 minutes (5 < 20) -> keep session
            memory.destroyExpireSession(20);

            Date.now = origNow;

            memory.read('recent-sid', (err, data) => {
                expect(err).toBeNull();
                expect(data).toEqual({ test: true });
                done();
            });
        });
    });
});
