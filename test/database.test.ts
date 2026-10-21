const _DatabaseAdapter = require('../src/adapter/database');
const DatabaseAdapter = _DatabaseAdapter.default || _DatabaseAdapter;

describe('adapter/database', () => {
    test('read queries table for sid and parses JSON or returns null', (done) => {
        const mockTable = {
            where: jest.fn().mockReturnThis(),
            value: jest.fn((col) => {
                return Promise.resolve(JSON.stringify({ user: 'John' }));
            })
        };
        const mockConn = {
            table: jest.fn(() => mockTable)
        };

        const adapter = new DatabaseAdapter(mockConn, 'sessions');

        adapter.read('sid1', (err, data) => {
            expect(err).toBeNull();
            expect(data).toEqual({ user: 'John' });
            expect(mockConn.table).toHaveBeenCalledWith('sessions');
            expect(mockTable.where).toHaveBeenCalledWith({ sid: 'sid1' });

            // test null payload
            mockTable.value = jest.fn(() => Promise.resolve(null));
            adapter.read('sid2', (err2, data2) => {
                expect(err2).toBeNull();
                expect(data2).toBeNull();

                // test reject
                mockTable.value = jest.fn(() => Promise.reject(new Error('DB error')));
                adapter.read('sid3', (err3, data3) => {
                    expect(err3).toBeDefined();
                    expect(data3).toBeNull();
                    done();
                });
            });
        });
    });

    test('write calls updateOrInsert with sid and serialized payload', (done) => {
        const mockTable = {
            updateOrInsert: jest.fn((where, update) => Promise.resolve(1))
        };
        const mockConn = {
            table: jest.fn(() => mockTable)
        };

        const adapter = new DatabaseAdapter(mockConn, 'sessions');

        adapter.write('sid1', { test: true }, (err, res) => {
            expect(err).toBeNull();
            expect(res).toBe(1);
            expect(mockTable.updateOrInsert).toHaveBeenCalledWith({ sid: 'sid1' }, { payload: JSON.stringify({ test: true }) });

            // test reject
            mockTable.updateOrInsert = jest.fn(() => Promise.reject(new Error('Write error')));
            adapter.write('sid2', {}, (err2, res2) => {
                expect(err2).toBeDefined();
                expect(res2).toBeNull();
                done();
            });
        });
    });

    test('destroy calls delete where sid matches', (done) => {
        const mockTable = {
            where: jest.fn().mockReturnThis(),
            delete: jest.fn(() => Promise.resolve(1))
        };
        const mockConn = {
            table: jest.fn(() => mockTable)
        };

        const adapter = new DatabaseAdapter(mockConn, 'sessions');

        adapter.destroy('sid1', (err, res) => {
            expect(err).toBeNull();
            expect(res).toBe(true);

            // test reject
            mockTable.delete = jest.fn(() => Promise.reject(new Error('Delete error')));
            adapter.destroy('sid2', (err2, res2) => {
                expect(err2).toBeDefined();
                expect(res2).toBe(false);
                done();
            });
        });
    });
});
