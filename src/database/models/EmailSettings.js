const BaseModel = require('./BaseModel');

class EmailSettings extends BaseModel {
    constructor(db) {
        super(db, 'email_settings');
    }

    /**
     * Get global email settings
     */
    async getGlobal() {
        return await this.findOne('is_global = 1 AND is_active = 1');
    }

    /**
     * Get all active email settings
     */
    async getActive() {
        return await this.findAll('is_active = 1');
    }

    /**
     * Create or update email settings
     */
    async createOrUpdate(data) {
        // If this is a global setting, deactivate other global settings
        if (data.is_global) {
            await this.db.run(
                'UPDATE email_settings SET is_global = 0 WHERE is_global = 1'
            );
        }

        // Validate recipients JSON
        if (data.recipients && typeof data.recipients === 'string') {
            try {
                JSON.parse(data.recipients);
            } catch (error) {
                throw new Error('Recipients must be a valid JSON array');
            }
        }

        return await this.create(data);
    }

    /**
     * Test email settings
     */
    async testSettings(id) {
        const settings = await this.findById(id);
        if (!settings) {
            throw new Error('Email settings not found');
        }

        // Here you would implement actual email testing
        // For now, just return the settings to validate they exist
        return {
            success: true,
            settings: settings,
            message: 'Email settings are valid (test not implemented yet)'
        };
    }

    /**
     * Get recipients list as array
     */
    parseRecipients(recipientsJson) {
        try {
            return JSON.parse(recipientsJson || '[]');
        } catch (error) {
            return [];
        }
    }

    /**
     * Format email template
     */
    formatTemplate(template, variables = {}) {
        let formatted = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            formatted = formatted.replace(regex, value || '');
        }
        return formatted;
    }

    /**
     * Get email settings for a specific monitor
     */
    async getForMonitor(monitorId) {
        // First try to get monitor-specific settings
        const monitorSettings = await this.db.get(`
            SELECT es.* FROM email_settings es
            INNER JOIN ticket_monitors tm ON es.id = tm.email_settings_id
            WHERE tm.id = ? AND es.is_active = 1
        `, [monitorId]);

        if (monitorSettings) {
            return monitorSettings;
        }

        // Fall back to global settings
        return await this.getGlobal();
    }
}

module.exports = EmailSettings;