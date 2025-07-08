const { models } = require('../models');

/**
 * Seed development data for TicketBot
 */
async function seedDevelopmentData() {
    console.log('🌱 Seeding development data...');

    try {
        // Create default event categories (if not exists)
        await models.EventCategory.createDefaults();
        
        // Get categories for reference
        const categories = await models.EventCategory.findAll();
        const concertCategory = categories.find(c => c.name === 'Konzert');
        const theaterCategory = categories.find(c => c.name === 'Theater');
        const sportCategory = categories.find(c => c.name === 'Sport');

        // Create default email settings
        const emailSettings = await models.EmailSettings.create({
            name: 'Development SMTP',
            description: 'Entwicklungs-E-Mail-Konfiguration',
            is_global: 1,
            is_active: 1,
            smtp_host: 'smtp.gmail.com',
            smtp_port: 587,
            smtp_secure: 0,
            smtp_user: 'dev@ticketbot.example',
            smtp_password: 'dev_password',
            from_email: 'dev@ticketbot.example',
            recipients: JSON.stringify(['user@example.com', 'admin@example.com']),
            subject_template: '🎫 Tickets verfügbar: {{eventName}}',
            body_template: 'Hallo!\n\nTickets sind jetzt verfügbar für {{eventName}}!\n\nVenue: {{venue}}\nDatum: {{eventDate}}\nURL: {{url}}\n\nJetzt schnell zugreifen!\n\nViele Grüße,\nIhr TicketBot'
        });

        // Create sample ticket monitors
        const sampleMonitors = [
            {
                name: 'Rammstein - München 2024',
                event_name: 'Rammstein World Tour 2024',
                event_url: 'https://www.eventim.de/artist/rammstein/',
                event_date: '2024-07-15T20:00:00Z',
                venue: 'Olympiastadion München',
                category_id: concertCategory?.id,
                email_settings_id: emailSettings.id,
                search_text: 'ausverkauft',
                status: 'active',
                current_status: 'unavailable',
                user_id: 'dev@ticketbot.example'
            },
            {
                name: 'FC Bayern vs. Dortmund',
                event_name: 'FC Bayern München vs. Borussia Dortmund',
                event_url: 'https://fcbayern.com/tickets',
                event_date: '2024-04-15T15:30:00Z',
                venue: 'Allianz Arena',
                category_id: sportCategory?.id,
                email_settings_id: emailSettings.id,
                search_text: 'sold out',
                status: 'active',
                current_status: 'unavailable',
                user_id: 'dev@ticketbot.example'
            },
            {
                name: 'Der König der Löwen - Hamburg',
                event_name: 'Der König der Löwen',
                event_url: 'https://stage-entertainment.de/musicals-shows/der-koenig-der-loewen-hamburg/tickets.html',
                event_date: '2024-06-20T19:30:00Z',
                venue: 'Stage Theater im Hafen',
                category_id: theaterCategory?.id,
                email_settings_id: emailSettings.id,
                search_text: 'keine Verfügbarkeit',
                status: 'inactive',
                current_status: 'unknown',
                user_id: 'dev@ticketbot.example'
            },
            {
                name: 'Coldplay - Berlin',
                event_name: 'Coldplay Music of the Spheres Tour',
                event_url: 'https://www.eventim.de/artist/coldplay/',
                event_date: '2024-08-10T20:00:00Z',
                venue: 'Olympiastadion Berlin',
                category_id: concertCategory?.id,
                email_settings_id: emailSettings.id,
                search_text: 'ausverkauft',
                status: 'paused',
                current_status: 'available',
                user_id: 'dev@ticketbot.example',
                last_available_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
            }
        ];

        const createdMonitors = [];
        for (const monitorData of sampleMonitors) {
            const monitor = await models.TicketMonitor.create(monitorData);
            createdMonitors.push(monitor);
            console.log(`   ✅ Created monitor: ${monitor.name}`);
        }

        // Create sample check history for monitors
        console.log('🔍 Creating sample check history...');
        for (const monitor of createdMonitors) {
            // Create some historical checks
            for (let i = 0; i < 10; i++) {
                const timestamp = new Date(Date.now() - (i * 1800000)); // Every 30 minutes
                const status = Math.random() > 0.8 ? 'available' : 'unavailable';
                const responseTime = 1000 + Math.random() * 3000; // 1-4 seconds
                
                await models.TicketCheckHistory.create({
                    monitor_id: monitor.id,
                    timestamp: timestamp.toISOString(),
                    status: status,
                    http_response_code: 200,
                    response_time_ms: Math.round(responseTime),
                    content_found: status === 'unavailable' ? 1 : 0,
                    content_hash: `hash_${Date.now()}_${Math.random()}`,
                    user_agent: 'Mozilla/5.0 (compatible; TicketBot/1.0)',
                    suspected_bot_detection: 0,
                    captcha_detected: 0,
                    rate_limited: 0
                });
            }
        }

        // Create some price classes for the concert monitors
        console.log('💰 Creating sample price classes...');
        const concertMonitors = createdMonitors.filter(m => m.category_id === concertCategory?.id);
        for (const monitor of concertMonitors) {
            await models.TicketPriceClass.createDefaults(monitor.id, 'concert');
        }

        // Create some anti-bot detection logs
        console.log('🤖 Creating sample anti-bot detection logs...');
        const randomMonitor = createdMonitors[Math.floor(Math.random() * createdMonitors.length)];
        await models.AntiBotDetectionLog.create({
            monitor_id: randomMonitor.id,
            detection_type: 'captcha',
            severity: 'medium',
            http_status_code: 403,
            page_title: 'Security Check Required',
            error_indicators: JSON.stringify(['captcha-container', 'Please verify you are human']),
            countermeasure_applied: 'User agent rotation applied',
            user_agent_rotated: 1,
            delay_increased: 1,
            url: randomMonitor.event_url,
            notes: 'Detected Google reCAPTCHA on ticket page'
        });

        console.log('✅ Development data seeded successfully!');
        console.log(`   📊 Created ${createdMonitors.length} sample monitors`);
        console.log(`   📧 Created email settings`);
        console.log(`   📈 Created sample check history`);
        console.log(`   💰 Created sample price classes`);
        console.log(`   🤖 Created sample bot detection logs`);

        return {
            monitors: createdMonitors,
            emailSettings: emailSettings,
            categories: categories
        };

    } catch (error) {
        console.error('❌ Error seeding development data:', error);
        throw error;
    }
}

/**
 * Clear all development data
 */
async function clearDevelopmentData() {
    console.log('🧹 Clearing development data...');
    
    try {
        // Delete in reverse dependency order
        await models.TicketPriceClass.db.run('DELETE FROM ticket_price_classes');
        await models.AntiBotDetectionLog.db.run('DELETE FROM anti_bot_detection_logs');
        await models.TicketCheckHistory.db.run('DELETE FROM ticket_check_history');
        await models.TicketMonitor.db.run('DELETE FROM ticket_monitors');
        await models.EmailSettings.db.run('DELETE FROM email_settings');
        // Keep event categories as they are defaults
        
        console.log('✅ Development data cleared!');
    } catch (error) {
        console.error('❌ Error clearing development data:', error);
        throw error;
    }
}

module.exports = {
    seedDevelopmentData,
    clearDevelopmentData
};