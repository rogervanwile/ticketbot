const fs = require('fs');
const path = require('path');
const db = require('./connection');

class MigrationRunner {
    constructor() {
        this.migrationsPath = path.join(__dirname, 'migrations');
    }

    /**
     * Initialize migration system
     */
    async init() {
        await db.connect();
        
        // Create migrations table if it doesn't exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL UNIQUE,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Run all pending migrations
     */
    async runMigrations() {
        await this.init();

        const migrationFiles = this.getMigrationFiles();
        const executedMigrations = await this.getExecutedMigrations();

        for (const filename of migrationFiles) {
            if (!executedMigrations.includes(filename)) {
                console.log(`🔄 Running migration: ${filename}`);
                await this.runMigration(filename);
                await this.recordMigration(filename);
                console.log(`✅ Migration completed: ${filename}`);
            }
        }

        console.log('🎯 All migrations completed');
    }

    /**
     * Get list of migration files
     */
    getMigrationFiles() {
        if (!fs.existsSync(this.migrationsPath)) {
            return [];
        }

        return fs.readdirSync(this.migrationsPath)
            .filter(file => file.endsWith('.js'))
            .sort();
    }

    /**
     * Get list of executed migrations
     */
    async getExecutedMigrations() {
        const rows = await db.all('SELECT filename FROM migrations ORDER BY id');
        return rows.map(row => row.filename);
    }

    /**
     * Run a single migration
     */
    async runMigration(filename) {
        const migrationPath = path.join(this.migrationsPath, filename);
        const migration = require(migrationPath);

        await db.beginTransaction();
        try {
            await migration.up(db);
            await db.commit();
        } catch (error) {
            await db.rollback();
            throw error;
        }
    }

    /**
     * Record migration as executed
     */
    async recordMigration(filename) {
        await db.run(
            'INSERT INTO migrations (filename) VALUES (?)',
            [filename]
        );
    }

    /**
     * Rollback last migration
     */
    async rollbackLastMigration() {
        await this.init();

        const lastMigration = await db.get(
            'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
        );

        if (!lastMigration) {
            console.log('📝 No migrations to rollback');
            return;
        }

        console.log(`🔄 Rolling back migration: ${lastMigration.filename}`);

        const migrationPath = path.join(this.migrationsPath, lastMigration.filename);
        const migration = require(migrationPath);

        await db.beginTransaction();
        try {
            if (migration.down) {
                await migration.down(db);
            }
            await db.run(
                'DELETE FROM migrations WHERE filename = ?',
                [lastMigration.filename]
            );
            await db.commit();
            console.log(`✅ Migration rolled back: ${lastMigration.filename}`);
        } catch (error) {
            await db.rollback();
            throw error;
        }
    }
}

module.exports = new MigrationRunner();