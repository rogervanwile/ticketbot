const express = require('express');
const router = express.Router();
const config = require('../config/config');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'TicketBot API',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Status endpoint
router.get('/status', (req, res) => {
    res.json({
        service: 'TicketBot',
        status: 'running',
        environment: config.server.environment,
        features: {
            ticketMonitoring: true,
            emailNotifications: true,
            antiBotDetection: true,
            dashboard: true
        },
        monitoring: {
            interval: config.monitoring.interval,
            maxRetries: config.monitoring.maxRetries,
            timeout: config.monitoring.timeout
        },
        timestamp: new Date().toISOString()
    });
});

// Get monitored events
router.get('/events', (req, res) => {
    // This is a placeholder - in a real implementation, this would query the database
    res.json({
        events: [
            {
                id: 1,
                name: 'Sample Concert',
                venue: 'Example Arena',
                date: '2024-12-31T20:00:00Z',
                url: 'https://example.com/tickets',
                status: 'monitoring',
                lastChecked: new Date().toISOString(),
                available: false
            }
        ],
        total: 1,
        monitoring: true
    });
});

// Add new event to monitor
router.post('/events', (req, res) => {
    const { name, venue, date, url } = req.body;
    
    if (!name || !url) {
        return res.status(400).json({
            error: 'Name and URL are required'
        });
    }
    
    // This is a placeholder - in a real implementation, this would save to database
    const newEvent = {
        id: Date.now(),
        name,
        venue: venue || 'Unknown Venue',
        date: date || null,
        url,
        status: 'monitoring',
        createdAt: new Date().toISOString(),
        available: false
    };
    
    res.status(201).json({
        message: 'Event added to monitoring',
        event: newEvent
    });
});

// Get monitoring statistics
router.get('/stats', (req, res) => {
    res.json({
        totalEvents: 1,
        activeMonitoring: 1,
        availableTickets: 0,
        lastCheck: new Date().toISOString(),
        uptime: process.uptime(),
        checksToday: 288, // Assuming 5-minute intervals
        emailsSent: 0
    });
});

module.exports = router;