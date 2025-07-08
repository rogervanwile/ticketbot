const BaseModel = require('./BaseModel');

class TicketPriceClass extends BaseModel {
    constructor(db) {
        super(db, 'ticket_price_classes');
    }

    /**
     * Get price classes for a monitor
     */
    async getByMonitor(monitorId) {
        return await this.findAll(
            'monitor_id = ? ORDER BY priority ASC, name ASC',
            [monitorId]
        );
    }

    /**
     * Get monitored price classes for a monitor
     */
    async getMonitoredByMonitor(monitorId) {
        return await this.findAll(
            'monitor_id = ? AND monitor_this_class = 1 ORDER BY priority ASC',
            [monitorId]
        );
    }

    /**
     * Get available price classes
     */
    async getAvailable(monitorId = null) {
        if (monitorId) {
            return await this.findAll(
                'monitor_id = ? AND is_available = 1 ORDER BY priority ASC',
                [monitorId]
            );
        }
        
        const sql = `
            SELECT 
                tpc.*,
                tm.name as monitor_name,
                tm.event_name
            FROM ticket_price_classes tpc
            INNER JOIN ticket_monitors tm ON tpc.monitor_id = tm.id
            WHERE tpc.is_available = 1
            ORDER BY tpc.priority ASC, tm.name ASC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Update availability status
     */
    async updateAvailability(id, isAvailable) {
        const updateData = { 
            is_available: isAvailable ? 1 : 0 
        };
        
        if (isAvailable) {
            updateData.last_available_at = new Date().toISOString();
        }
        
        return await this.update(id, updateData);
    }

    /**
     * Bulk update availabilities for a monitor
     */
    async updateMonitorAvailabilities(monitorId, availabilities) {
        await this.db.beginTransaction();
        
        try {
            for (const { id, isAvailable } of availabilities) {
                await this.updateAvailability(id, isAvailable);
            }
            await this.db.commit();
        } catch (error) {
            await this.db.rollback();
            throw error;
        }
    }

    /**
     * Get price range summary for a monitor
     */
    async getPriceSummary(monitorId) {
        const sql = `
            SELECT 
                MIN(price_range_min) as min_price,
                MAX(price_range_max) as max_price,
                COUNT(*) as total_classes,
                COUNT(CASE WHEN is_available = 1 THEN 1 END) as available_classes,
                COUNT(CASE WHEN monitor_this_class = 1 THEN 1 END) as monitored_classes,
                currency
            FROM ticket_price_classes 
            WHERE monitor_id = ?
            GROUP BY currency
        `;
        
        const result = await this.db.get(sql, [monitorId]);
        return result;
    }

    /**
     * Find price class by selector
     */
    async findBySelector(monitorId, selector) {
        return await this.findOne(
            'monitor_id = ? AND (css_selector = ? OR text_identifier = ? OR url_parameter = ?)',
            [monitorId, selector, selector, selector]
        );
    }

    /**
     * Create default price classes for a monitor
     */
    async createDefaults(monitorId, eventType = 'generic') {
        const defaults = this.getDefaultClassesByType(eventType);
        
        for (const priceClass of defaults) {
            priceClass.monitor_id = monitorId;
            await this.create(priceClass);
        }
    }

    /**
     * Get default price classes by event type
     */
    getDefaultClassesByType(eventType) {
        const defaults = {
            'concert': [
                { name: 'VIP', priority: 1, price_range_min: 100, price_range_max: 300 },
                { name: 'Category 1', priority: 2, price_range_min: 50, price_range_max: 100 },
                { name: 'Category 2', priority: 3, price_range_min: 30, price_range_max: 60 },
                { name: 'Standing', priority: 4, price_range_min: 20, price_range_max: 40 }
            ],
            'theater': [
                { name: 'Parkett', priority: 1, price_range_min: 40, price_range_max: 80 },
                { name: '1. Rang', priority: 2, price_range_min: 30, price_range_max: 60 },
                { name: '2. Rang', priority: 3, price_range_min: 20, price_range_max: 40 },
                { name: 'Galerie', priority: 4, price_range_min: 15, price_range_max: 30 }
            ],
            'sport': [
                { name: 'VIP Loge', priority: 1, price_range_min: 150, price_range_max: 500 },
                { name: 'Tribüne', priority: 2, price_range_min: 40, price_range_max: 100 },
                { name: 'Stehplatz', priority: 3, price_range_min: 15, price_range_max: 40 }
            ],
            'generic': [
                { name: 'Premium', priority: 1, price_range_min: 50, price_range_max: 150 },
                { name: 'Standard', priority: 2, price_range_min: 25, price_range_max: 75 },
                { name: 'Budget', priority: 3, price_range_min: 10, price_range_max: 35 }
            ]
        };

        return defaults[eventType] || defaults['generic'];
    }

    /**
     * Get statistics for price classes
     */
    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_classes,
                COUNT(CASE WHEN is_available = 1 THEN 1 END) as available_classes,
                COUNT(CASE WHEN monitor_this_class = 1 THEN 1 END) as monitored_classes,
                COUNT(DISTINCT monitor_id) as monitors_with_classes,
                AVG(price_range_min) as avg_min_price,
                AVG(price_range_max) as avg_max_price
            FROM ticket_price_classes
        `;
        
        return await this.db.get(sql);
    }
}

module.exports = TicketPriceClass;