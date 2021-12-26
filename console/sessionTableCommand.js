const Command = require('@ostro/console/command')

class SessionTableCommand extends Command {

    $signature = 'session:table';

    $description = 'Create a migration for the session database table';

    $files;

    constructor($files) {
        super()

        this.$files = $files;
    }

    async handle() {
        let $fullPath = await this.createBaseMigration();
        await this.$files.put($fullPath, await this.$files.get(__dirname + '/stubs/database.stub'));

        this.info('Migration created successfully!');

    }

    createBaseMigration() {
        let $name = 'create_sessions_table';

        let $path = this.$app.databasePath('migrations');

        return this.$app['migration.creator'].create($name, $path);
    }
}

module.exports = SessionTableCommand