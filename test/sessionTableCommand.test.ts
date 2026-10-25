import { describe, test, expect, jest } from "@jest/globals";
const path = require('node:path');
const _SessionTableCommand = require('../src/console/sessionTableCommand');
const SessionTableCommand = _SessionTableCommand.default || _SessionTableCommand;

describe('console/sessionTableCommand', () => {
    test('instantiates and runs handle creating migration file from stub', async () => {
        const mockFiles = {
            put: jest.fn().mockResolvedValue(true),
            get: jest.fn().mockResolvedValue('MIGRATION_STUB_CONTENT')
        };

        const command = new SessionTableCommand(mockFiles);
        command.info = jest.fn();

        const mockApp = {
            databasePath: jest.fn((sub) => '/project/database/' + sub),
            'migration.creator': {
                create: jest.fn().mockResolvedValue('/project/database/migrations/2026_01_01_000000_create_sessions_table.js')
            }
        };
        command.$app = mockApp;

        await command.handle();

        expect(mockApp.databasePath).toHaveBeenCalledWith('migrations');
        expect(mockApp['migration.creator'].create).toHaveBeenCalledWith('create_sessions_table', '/project/database/migrations');
        expect(mockFiles.get).toHaveBeenCalledWith(path.resolve(__dirname, '../src/console/stubs/database.stub'));
        expect(mockFiles.put).toHaveBeenCalledWith(
            '/project/database/migrations/2026_01_01_000000_create_sessions_table.js',
            'MIGRATION_STUB_CONTENT'
        );
        expect(command.info).toHaveBeenCalledWith('Migration created successfully!');
    });
});
