#!/usr/bin/env node

/**
 * Database management CLI tool
 */

const migrationRunner = require('./src/database/migrationRunner');
const { seedDevelopmentData, clearDevelopmentData } = require('./src/database/seeds/developmentSeed');
const { initializeDatabase, closeDatabase } = require('./src/database/models');

async function runCommand(command) {
    try {
        await initializeDatabase();
        
        switch (command) {
            case 'migrate':
                console.log('🔄 Running database migrations...');
                await migrationRunner.runMigrations();
                break;
                
            case 'seed':
                console.log('🌱 Seeding development data...');
                await migrationRunner.runMigrations(); // Ensure migrations are up to date
                await seedDevelopmentData();
                break;
                
            case 'reset':
                console.log('🔄 Resetting database...');
                await clearDevelopmentData();
                await migrationRunner.runMigrations();
                await seedDevelopmentData();
                break;
                
            case 'clear':
                console.log('🧹 Clearing development data...');
                await clearDevelopmentData();
                break;
                
            case 'rollback':
                console.log('⬅️  Rolling back last migration...');
                await migrationRunner.rollbackLastMigration();
                break;
                
            default:
                console.log('❌ Unknown command:', command);
                console.log('Available commands: migrate, seed, reset, clear, rollback');
                process.exit(1);
        }
        
        console.log('✅ Command completed successfully!');
        
    } catch (error) {
        console.error('❌ Error running command:', error.message);
        process.exit(1);
    } finally {
        await closeDatabase();
    }
}

// Get command from command line arguments
const command = process.argv[2];

if (!command) {
    console.log('Usage: node db-cli.js <command>');
    console.log('Commands:');
    console.log('  migrate  - Run database migrations');
    console.log('  seed     - Seed development data');
    console.log('  reset    - Reset database and seed data');
    console.log('  clear    - Clear development data');
    console.log('  rollback - Rollback last migration');
    process.exit(1);
}

runCommand(command);