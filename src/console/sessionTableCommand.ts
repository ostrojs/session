import Command from '@ostro/console/command';

/**
 * Class SessionTableCommand.
 */
class SessionTableCommand extends Command {
    public get $signature(): string {
        return 'session:table';
    }
    public get $description(): string {
        return 'Create a migration for the session database table';
    }
    public $files: any;
    declare $app: any;
    public declare info: any;

    /**
     * Create a new SessionTableCommand instance.
     *
     * @param $files - Filesystem service.
     */
    constructor($files: any) {
        super();
        this.$files = $files;
    }

    /**
     * Handle command execution.
     */
    public async handle(): Promise<void> {
        const $fullPath: string = await this.createBaseMigration();
        const stubName: string = $fullPath.endsWith('.ts') ? '/stubs/database.ts.stub' : '/stubs/database.stub';
        await this.$files.put($fullPath, await this.$files.get(__dirname + stubName));

        this.info('Migration created successfully!');
    }

    /**
     * Create base migration file.
     *
     * @returns Created migration path.
     */
    public createBaseMigration(): any {
        const $name: string = 'create_sessions_table';
        const $path: string = this.$app.databasePath('migrations');

        return this.$app['migration.creator'].create($name, $path);
    }
}

export default SessionTableCommand;