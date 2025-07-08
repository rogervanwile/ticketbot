/**
 * Migration: Create ticket_monitors table
 * Main table for storing ticket monitor configurations
 */

module.exports = {
    async up(db) {
        await db.run(`
            CREATE TABLE ticket_monitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                event_url TEXT NOT NULL,
                search_text TEXT DEFAULT 'ausverkauft',
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
                
                -- Event Details
                event_name TEXT,
                event_date DATETIME,
                venue TEXT,
                
                -- Category
                category_id INTEGER,
                
                -- Monitoring Configuration
                check_interval INTEGER DEFAULT 300000, -- 5 minutes in milliseconds
                max_retries INTEGER DEFAULT 3,
                timeout INTEGER DEFAULT 30000,
                
                -- User Assignment (for multi-user setup)
                user_id TEXT, -- Can be email or user identifier
                
                -- Email Settings
                email_settings_id INTEGER,
                
                -- Status tracking
                last_check_at DATETIME,
                last_available_at DATETIME,
                current_status TEXT DEFAULT 'unknown' CHECK (current_status IN ('available', 'unavailable', 'error', 'unknown')),
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE SET NULL,
                FOREIGN KEY (email_settings_id) REFERENCES email_settings(id) ON DELETE SET NULL
            )
        `);

        // Create indexes for better performance
        await db.run('CREATE INDEX idx_ticket_monitors_status ON ticket_monitors(status)');
        await db.run('CREATE INDEX idx_ticket_monitors_user_id ON ticket_monitors(user_id)');
        await db.run('CREATE INDEX idx_ticket_monitors_category ON ticket_monitors(category_id)');
        await db.run('CREATE INDEX idx_ticket_monitors_last_check ON ticket_monitors(last_check_at)');
    },

    async down(db) {
        await db.run('DROP TABLE IF EXISTS ticket_monitors');
    }
};