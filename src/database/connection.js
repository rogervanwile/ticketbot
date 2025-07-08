const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

class DatabaseConnection {
    constructor() {
        this.db = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection
     */
    async connect() {
        if (this.isConnected) {
            return this.db;
        }

        try {
            const dbType = config.database.type;
            
            if (dbType === 'sqlite') {
                await this.connectSQLite();
            } else if (dbType === 'postgresql') {
                throw new Error('PostgreSQL support not implemented yet. Use SQLite for now.');
            } else {
                throw new Error(`Unsupported database type: ${dbType}`);
            }

            this.isConnected = true;
            console.log(`✅ Database connected (${dbType})`);
            return this.db;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Connect to SQLite database
     */
    async connectSQLite() {
        const dbPath = config.database.sqlite.path;
        
        // Ensure directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir) && dbDir !== '.') {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve(this.db);
                }
            });
        });
    }

    /**
     * Execute a query with parameters
     */
    async run(sql, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        lastID: this.lastID, 
                        changes: this.changes 
                    });
                }
            });
        });
    }

    /**
     * Get a single row
     */
    async get(sql, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows
     */
    async all(sql, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db && this.isConnected) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.isConnected = false;
                        console.log('📪 Database connection closed');
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * Begin transaction
     */
    async beginTransaction() {
        await this.run('BEGIN TRANSACTION');
    }

    /**
     * Commit transaction
     */
    async commit() {
        await this.run('COMMIT');
    }

    /**
     * Rollback transaction
     */
    async rollback() {
        await this.run('ROLLBACK');
    }
}

// Export singleton instance
module.exports = new DatabaseConnection();