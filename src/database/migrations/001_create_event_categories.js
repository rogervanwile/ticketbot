/**
 * Migration: Create event_categories table
 * TicketBot-specific event categories (Concert, Theater, Sport, Festival)
 */

module.exports = {
    async up(db) {
        await db.run(`
            CREATE TABLE event_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                color TEXT DEFAULT '#3498db',
                icon TEXT DEFAULT '🎫',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default categories
        const categories = [
            { name: 'Konzert', description: 'Musik-Konzerte und Live-Auftritte', color: '#e74c3c', icon: '🎵' },
            { name: 'Theater', description: 'Theater-Aufführungen und Bühnenstücke', color: '#9b59b6', icon: '🎭' },
            { name: 'Sport', description: 'Sportereignisse und Wettkämpfe', color: '#2ecc71', icon: '⚽' },
            { name: 'Festival', description: 'Festivals und mehrtägige Events', color: '#f39c12', icon: '🎪' },
            { name: 'Sonstiges', description: 'Andere Veranstaltungen', color: '#34495e', icon: '🎫' }
        ];

        for (const category of categories) {
            await db.run(`
                INSERT INTO event_categories (name, description, color, icon)
                VALUES (?, ?, ?, ?)
            `, [category.name, category.description, category.color, category.icon]);
        }
    },

    async down(db) {
        await db.run('DROP TABLE IF EXISTS event_categories');
    }
};