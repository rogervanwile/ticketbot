require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const cron = require('node-cron');

// Import routes and services
const apiRoutes = require('./routes/api');
const ticketService = require('./services/ticketService');
const config = require('./config/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // Enable compression for responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Routes
app.use('/api', apiRoutes);

// Serve main dashboard
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🎫 TicketBot - Dashboard</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                }
                h1 {
                    text-align: center;
                    font-size: 2.5em;
                    margin-bottom: 10px;
                }
                .subtitle {
                    text-align: center;
                    font-size: 1.2em;
                    opacity: 0.9;
                    margin-bottom: 40px;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 40px 0;
                }
                .feature {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                .status {
                    background: rgba(46, 213, 115, 0.2);
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    margin: 20px 0;
                }
                .api-info {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                a {
                    color: #fff;
                    text-decoration: none;
                    font-weight: bold;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎫 TicketBot</h1>
                <div class="subtitle">Automated Ticket Availability Monitoring System</div>
                
                <div class="status">
                    ✅ Server läuft erfolgreich auf Port ${PORT}
                </div>
                
                <div class="features">
                    <div class="feature">
                        <h3>🎫 Ticket Monitoring</h3>
                        <p>Überwacht kontinuierlich die Verfügbarkeit von Event-Tickets</p>
                    </div>
                    <div class="feature">
                        <h3>📧 E-Mail Benachrichtigungen</h3>
                        <p>Automatische Benachrichtigungen bei verfügbaren Tickets</p>
                    </div>
                    <div class="feature">
                        <h3>🕸️ Anti-Bot-Detection</h3>
                        <p>Umgeht intelligente Bot-Detection-Systeme</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Dashboard</h3>
                        <p>Übersichtliches Monitoring-Dashboard</p>
                    </div>
                </div>
                
                <div class="api-info">
                    <h3>📡 API Endpunkte</h3>
                    <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
                    <p><strong>Status:</strong> <a href="/api/status">/api/status</a></p>
                    <p><strong>Monitored Events:</strong> <a href="/api/events">/api/events</a></p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Initialize ticket monitoring cron job
cron.schedule('*/5 * * * *', () => {
    console.log('🔍 Running ticket availability check...');
    ticketService.checkTicketAvailability();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
🎫 TicketBot Server gestartet!
🌐 Server läuft auf: http://localhost:${PORT}
📊 Dashboard: http://localhost:${PORT}
📡 API: http://localhost:${PORT}/api
🔍 Monitoring aktiv: ${process.env.MONITORING_INTERVAL}ms Intervall
    `);
});

module.exports = app;