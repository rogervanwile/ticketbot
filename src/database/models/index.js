const db = require('../connection');

// Import all models
const EventCategory = require('./EventCategory');
const EmailSettings = require('./EmailSettings');
const TicketMonitor = require('./TicketMonitor');
const TicketCheckHistory = require('./TicketCheckHistory');
const AntiBotDetectionLog = require('./AntiBotDetectionLog');
const TicketPriceClass = require('./TicketPriceClass');

// Initialize models with database connection
const models = {
    EventCategory: new EventCategory(db),
    EmailSettings: new EmailSettings(db),
    TicketMonitor: new TicketMonitor(db),
    TicketCheckHistory: new TicketCheckHistory(db),
    AntiBotDetectionLog: new AntiBotDetectionLog(db),
    TicketPriceClass: new TicketPriceClass(db)
};

// Initialize database connection
async function initializeDatabase() {
    await db.connect();
    console.log('📊 Database models initialized');
}

// Close database connection
async function closeDatabase() {
    await db.close();
}

module.exports = {
    db,
    models,
    initializeDatabase,
    closeDatabase
};