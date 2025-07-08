/**
 * Migration: Create ticket_check_history table
 * Store the history of all ticket availability checks
 */

module.exports = {
    async up(db) {
        await db.run(`
            CREATE TABLE ticket_check_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                monitor_id INTEGER NOT NULL,
                
                -- Check Results
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'error')),
                
                -- HTTP Response Details
                http_response_code INTEGER,
                response_time_ms INTEGER,
                error_message TEXT,
                
                -- Content Analysis
                content_found INTEGER DEFAULT 0, -- 1 if search text was found, 0 if not
                content_hash TEXT, -- Hash of relevant page content for change detection
                
                -- Debugging
                html_snapshot_path TEXT, -- Path to saved HTML for debugging
                user_agent TEXT,
                
                -- Anti-Bot Detection
                suspected_bot_detection INTEGER DEFAULT 0,
                captcha_detected INTEGER DEFAULT 0,
                rate_limited INTEGER DEFAULT 0,
                
                FOREIGN KEY (monitor_id) REFERENCES ticket_monitors(id) ON DELETE CASCADE
            )
        `);

        // Create indexes for better performance
        await db.run('CREATE INDEX idx_check_history_monitor_id ON ticket_check_history(monitor_id)');
        await db.run('CREATE INDEX idx_check_history_timestamp ON ticket_check_history(timestamp)');
        await db.run('CREATE INDEX idx_check_history_status ON ticket_check_history(status)');
        await db.run('CREATE INDEX idx_check_history_bot_detection ON ticket_check_history(suspected_bot_detection)');
    },

    async down(db) {
        await db.run('DROP TABLE IF EXISTS ticket_check_history');
    }
};