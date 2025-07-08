const BaseModel = require('./BaseModel');

class EventCategory extends BaseModel {
    constructor(db) {
        super(db, 'event_categories');
    }

    /**
     * Find category by name
     */
    async findByName(name) {
        return await this.findOne('name = ?', [name]);
    }

    /**
     * Get all active categories
     */
    async getActive() {
        return await this.findAll('1=1'); // All categories are active by default
    }

    /**
     * Get category with usage statistics
     */
    async getWithStats() {
        const sql = `
            SELECT 
                ec.*,
                COUNT(tm.id) as monitor_count,
                COUNT(CASE WHEN tm.status = 'active' THEN 1 END) as active_monitors
            FROM event_categories ec
            LEFT JOIN ticket_monitors tm ON ec.id = tm.category_id
            GROUP BY ec.id
            ORDER BY ec.name
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Create default categories if they don't exist
     */
    async createDefaults() {
        const defaults = [
            { name: 'Konzert', description: 'Musik-Konzerte und Live-Auftritte', color: '#e74c3c', icon: '🎵' },
            { name: 'Theater', description: 'Theater-Aufführungen und Bühnenstücke', color: '#9b59b6', icon: '🎭' },
            { name: 'Sport', description: 'Sportereignisse und Wettkämpfe', color: '#2ecc71', icon: '⚽' },
            { name: 'Festival', description: 'Festivals und mehrtägige Events', color: '#f39c12', icon: '🎪' },
            { name: 'Sonstiges', description: 'Andere Veranstaltungen', color: '#34495e', icon: '🎫' }
        ];

        for (const category of defaults) {
            const existing = await this.findByName(category.name);
            if (!existing) {
                await this.create(category);
            }
        }
    }
}

module.exports = EventCategory;