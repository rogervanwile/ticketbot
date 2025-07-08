/**
 * Migration: Create anti_bot_detection_logs table
 * Store logs of detected anti-bot measures and countermeasures
 */

module.exports = {
    async up(db) {
        await db.run(`
            CREATE TABLE anti_bot_detection_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                monitor_id INTEGER NOT NULL,
                
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                -- Detection Details
                detection_type TEXT NOT NULL CHECK (detection_type IN ('captcha', 'rate_limit', 'user_agent_block', 'ip_block', 'javascript_challenge', 'cloudflare', 'other')),
                severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                
                -- Technical Details
                http_status_code INTEGER,
                response_headers TEXT, -- JSON string of response headers
                page_title TEXT,
                error_indicators TEXT, -- JSON array of detected error indicators
                
                -- Countermeasures Applied
                countermeasure_applied TEXT, -- Description of what was done
                user_agent_rotated INTEGER DEFAULT 0,
                delay_increased INTEGER DEFAULT 0,
                proxy_switched INTEGER DEFAULT 0,
                
                -- URLs and Context
                url TEXT,
                referrer TEXT,
                
                -- Resolution
                resolved INTEGER DEFAULT 0,
                resolved_at DATETIME,
                resolution_method TEXT,
                
                notes TEXT,
                
                FOREIGN KEY (monitor_id) REFERENCES ticket_monitors(id) ON DELETE CASCADE
            )
        `);

        // Create indexes
        await db.run('CREATE INDEX idx_bot_logs_monitor_id ON anti_bot_detection_logs(monitor_id)');
        await db.run('CREATE INDEX idx_bot_logs_timestamp ON anti_bot_detection_logs(timestamp)');
        await db.run('CREATE INDEX idx_bot_logs_detection_type ON anti_bot_detection_logs(detection_type)');
        await db.run('CREATE INDEX idx_bot_logs_severity ON anti_bot_detection_logs(severity)');
        await db.run('CREATE INDEX idx_bot_logs_resolved ON anti_bot_detection_logs(resolved)');
    },

    async down(db) {
        await db.run('DROP TABLE IF EXISTS anti_bot_detection_logs');
    }
};