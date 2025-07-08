/**
 * Migration: Create email_settings table
 * SMTP configuration and recipient lists for ticket alerts
 */

module.exports = {
    async up(db) {
        await db.run(`
            CREATE TABLE email_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                is_global INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                
                -- SMTP Configuration
                smtp_host TEXT NOT NULL,
                smtp_port INTEGER NOT NULL DEFAULT 587,
                smtp_secure INTEGER DEFAULT 0,
                smtp_user TEXT NOT NULL,
                smtp_password TEXT NOT NULL,
                from_email TEXT NOT NULL,
                
                -- Recipients
                recipients TEXT NOT NULL, -- JSON array of email addresses
                
                -- Email Templates
                subject_template TEXT DEFAULT '🎫 Tickets verfügbar: {{eventName}}',
                body_template TEXT DEFAULT 'Tickets sind jetzt verfügbar für {{eventName}}!\\n\\nVeue: {{venue}}\\nURL: {{url}}\\n\\nJetzt schnell zugreifen!',
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create default global email settings
        await db.run(`
            INSERT INTO email_settings (
                name, description, is_global, is_active,
                smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_email,
                recipients
            ) VALUES (
                'Default SMTP', 'Standard E-Mail-Konfiguration', 1, 0,
                'smtp.gmail.com', 587, 0, '', '', '',
                '[]'
            )
        `);
    },

    async down(db) {
        await db.run('DROP TABLE IF EXISTS email_settings');
    }
};