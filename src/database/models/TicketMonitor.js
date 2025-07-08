const BaseModel = require('./BaseModel');

class TicketMonitor extends BaseModel {
    constructor(db) {
        super(db, 'ticket_monitors');
    }

    /**
     * Get all active monitors
     */
    async getActive() {
        return await this.findAll('status = ?', ['active']);
    }

    /**
     * Get monitors by user
     */
    async getByUser(userId) {
        return await this.findAll('user_id = ?', [userId]);
    }

    /**
     * Get monitors with category and email settings details
     */
    async getWithDetails(where = '1=1', params = []) {
        const sql = `
            SELECT 
                tm.*,
                ec.name as category_name,
                ec.color as category_color,
                ec.icon as category_icon,
                es.name as email_settings_name,
                es.is_active as email_active
            FROM ticket_monitors tm
            LEFT JOIN event_categories ec ON tm.category_id = ec.id
            LEFT JOIN email_settings es ON tm.email_settings_id = es.id
            WHERE ${where}
            ORDER BY tm.created_at DESC
        `;
        
        return await this.db.all(sql, params);
    }

    /**
     * Get monitor by ID with all details
     */
    async getByIdWithDetails(id) {
        const monitors = await this.getWithDetails('tm.id = ?', [id]);
        return monitors.length > 0 ? monitors[0] : null;
    }

    /**
     * Update monitor status
     */
    async updateStatus(id, status) {
        return await this.update(id, { status });
    }

    /**
     * Update last check timestamp
     */
    async updateLastCheck(id, currentStatus = null) {
        const updateData = { last_check_at: new Date().toISOString() };
        if (currentStatus) {
            updateData.current_status = currentStatus;
            if (currentStatus === 'available') {
                updateData.last_available_at = new Date().toISOString();
            }
        }
        return await this.update(id, updateData);
    }

    /**
     * Get monitors that need to be checked
     */
    async getMonitorsToCheck() {
        const now = new Date();
        const sql = `
            SELECT * FROM ticket_monitors 
            WHERE status = 'active' 
            AND (
                last_check_at IS NULL 
                OR datetime(last_check_at, '+' || (check_interval / 1000) || ' seconds') <= datetime('now')
            )
            ORDER BY 
                CASE WHEN last_check_at IS NULL THEN 0 ELSE 1 END,
                last_check_at ASC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Get monitoring statistics
     */
    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN current_status = 'available' THEN 1 END) as available,
                COUNT(CASE WHEN last_check_at > datetime('now', '-1 day') THEN 1 END) as checked_today
            FROM ticket_monitors
        `;
        
        const result = await this.db.get(sql);
        return result;
    }

    /**
     * Search monitors
     */
    async search(query) {
        const searchTerm = `%${query}%`;
        return await this.getWithDetails(
            'tm.name LIKE ? OR tm.event_name LIKE ? OR tm.venue LIKE ?',
            [searchTerm, searchTerm, searchTerm]
        );
    }

    /**
     * Get monitors by category
     */
    async getByCategory(categoryId) {
        return await this.getWithDetails('tm.category_id = ?', [categoryId]);
    }

    /**
     * Clone monitor with new name
     */
    async clone(id, newName) {
        const original = await this.findById(id);
        if (!original) {
            throw new Error('Monitor not found');
        }

        const cloneData = { ...original };
        delete cloneData.id;
        delete cloneData.created_at;
        delete cloneData.updated_at;
        delete cloneData.last_check_at;
        delete cloneData.last_available_at;
        
        cloneData.name = newName;
        cloneData.status = 'inactive'; // Start cloned monitors as inactive
        cloneData.current_status = 'unknown';

        return await this.create(cloneData);
    }
}

module.exports = TicketMonitor;