import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const _FileAdapter = require('../src/adapter/file');
const FileAdapter = _FileAdapter.default || _FileAdapter;

describe('adapter/file', () => {
    let tempDir;
    let adapter;

    beforeEach(() => {
        tempDir = path.join(os.tmpdir(), 'ostro-session-file-test-' + Date.now() + '-' + Math.random().toString(36).substring(7));
        adapter = new FileAdapter(tempDir);
    });

    afterEach(async () => {
        await fs.remove(tempDir);
    });

    test('constructor creates directory', () => {
        expect(fs.existsSync(tempDir)).toBe(true);
    });

    test('write and read session file', (done) => {
        adapter.write('sid1', { foo: 'bar' }, (err) => {
            expect(err).toBeFalsy();
            adapter.read('sid1', (readErr, data) => {
                expect(readErr).toBeFalsy();
                expect(data).toEqual({ foo: 'bar' });
                done();
            });
        });
    });

    test('destroy removes session file with and without callback', (done) => {
        adapter.write('sid2', { val: 42 }, () => {
            adapter.destroy('sid2', (err) => {
                expect(err).toBeFalsy();
                expect(fs.existsSync(path.join(tempDir, 'sid2'))).toBe(false);
                // without cb
                adapter.destroy('sid2');
                setTimeout(done, 50);
            });
        });
    });

    test('destroyExpireSession handles read errors / empty directories', () => {
        const brokenAdapter = new FileAdapter(path.join(tempDir, 'non-existent-sub'));
        // Should not throw when directory is empty or readdir has error
        expect(() => brokenAdapter.destroyExpireSession(10)).not.toThrow();
    });

    test('destroyExpireSession ignores dot files and cleans up expired files', (done) => {
        const dotFile = path.join(tempDir, '.hidden');
        const activeFile = path.join(tempDir, 'active-sid');
        const expiredFile = path.join(tempDir, 'expired-sid');

        fs.writeFileSync(dotFile, 'secret');
        fs.writeJsonSync(activeFile, { active: true });
        fs.writeJsonSync(expiredFile, { expired: true });

        // Set mtime/atime of expiredFile to 1 hour ago
        const past = new Date(Date.now() - 60 * 60 * 1000);
        fs.utimesSync(expiredFile, past, past);

        // maxAge is 30 minutes
        adapter.destroyExpireSession(30);

        setTimeout(() => {
            expect(fs.existsSync(dotFile)).toBe(true);
            expect(fs.existsSync(activeFile)).toBe(true);
            expect(fs.existsSync(expiredFile)).toBe(false);
            done();
        }, 100);
    });

    test('destroyExpireSession handles stat errors and non-expired files', (done) => {
        const nonExpiredFile = path.join(tempDir, 'fresh-sid');
        fs.writeJsonSync(nonExpiredFile, { fresh: true });

        // Mock fs.stat to trigger error branch
        const origStat = fs.stat;
        let callCount = 0;
        fs.stat = function(filePath, cb) {
            callCount++;
            if (callCount === 1) {
                return cb(new Error('stat error'), null);
            }
            return origStat.apply(this, arguments);
        };

        adapter.destroyExpireSession(30);

        setTimeout(() => {
            fs.stat = origStat;
            done();
        }, 100);
    });
});
