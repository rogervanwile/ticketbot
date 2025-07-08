/**
 * Migration: Create ticket_price_classes table (optional feature)
 * Track different price categories for tickets
 */

module.exports = {
    async up(db) {
        await db.run(`
            CREATE TABLE ticket_price_classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                monitor_id INTEGER NOT NULL,
                
                -- Price Class Details
                name TEXT NOT NULL, -- e.g., "VIP", "Category 1", "Standing", etc.
                price_range_min DECIMAL(10,2),
                price_range_max DECIMAL(10,2),
                currency TEXT DEFAULT 'EUR',
                
                -- Availability Tracking
                is_available INTEGER DEFAULT 0,
                last_available_at DATETIME,
                first_detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                -- Monitoring Settings
                monitor_this_class INTEGER DEFAULT 1, -- Whether to monitor this specific price class
                priority INTEGER DEFAULT 1, -- 1=highest, 5=lowest priority for notifications
                
                -- Selector/Identification
                css_selector TEXT, -- CSS selector to find this price class
                text_identifier TEXT, -- Text pattern to identify this price class
                url_parameter TEXT, -- URL parameter for this price class
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (monitor_id) REFERENCES ticket_monitors(id) ON DELETE CASCADE
            )
        `);

        // Create indexes
        await db.run('CREATE INDEX idx_price_classes_monitor_id ON ticket_price_classes(monitor_id)');
        await db.run('CREATE INDEX idx_price_classes_available ON ticket_price_classes(is_available)');
        await db.run('CREATE INDEX idx_price_classes_priority ON ticket_price_classes(priority)');
        await db.run('CREATE INDEX idx_price_classes_monitor_flag ON ticket_price_classes(monitor_this_class)');
    },

    async down(db) {
        await db.run('DROP TABLE IF EXISTS ticket_price_classes');
    }
};