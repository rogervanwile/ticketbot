const axios = require('axios');
const config = require('../config/config');

class TicketService {
    constructor() {
        this.monitoredEvents = [];
        this.isMonitoring = false;
    }

    /**
     * Check ticket availability for all monitored events
     */
    async checkTicketAvailability() {
        if (this.isMonitoring) {
            console.log('🔄 Previous check still running, skipping...');
            return;
        }

        this.isMonitoring = true;
        console.log(`🎫 Starting ticket availability check for ${this.monitoredEvents.length} events`);

        try {
            for (const event of this.monitoredEvents) {
                await this.checkSingleEvent(event);
                // Add delay between requests to avoid rate limiting
                await this.delay(2000);
            }
        } catch (error) {
            console.error('❌ Error during ticket availability check:', error.message);
        } finally {
            this.isMonitoring = false;
        }
    }

    /**
     * Check ticket availability for a single event
     * @param {Object} event - Event object with URL and details
     */
    async checkSingleEvent(event) {
        try {
            console.log(`🔍 Checking: ${event.name} - ${event.url}`);

            const response = await axios.get(event.url, {
                timeout: config.monitoring.timeout,
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'de-DE,de;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            });

            const isAvailable = this.analyzeTicketAvailability(response.data, event);
            
            if (isAvailable && !event.available) {
                console.log(`🎉 Tickets available for: ${event.name}!`);
                event.available = true;
                event.lastAvailable = new Date().toISOString();
                
                // Send notification (placeholder)
                await this.sendTicketNotification(event);
            } else if (!isAvailable && event.available) {
                console.log(`😞 Tickets no longer available for: ${event.name}`);
                event.available = false;
            }

            event.lastChecked = new Date().toISOString();
            event.status = 'checked';

        } catch (error) {
            console.error(`❌ Error checking ${event.name}:`, error.message);
            event.status = 'error';
            event.lastError = error.message;
            event.lastChecked = new Date().toISOString();
        }
    }

    /**
     * Analyze response content to determine ticket availability
     * @param {string} html - HTML response from ticket website
     * @param {Object} event - Event object
     * @returns {boolean} - True if tickets are available
     */
    analyzeTicketAvailability(html, event) {
        // This is a simplified analysis - in reality, this would be much more sophisticated
        // and tailored to specific ticket websites
        
        const unavailableKeywords = [
            'ausverkauft',
            'sold out',
            'nicht verfügbar',
            'not available',
            'vergriffen',
            'keine tickets',
            'no tickets'
        ];

        const availableKeywords = [
            'tickets kaufen',
            'buy tickets',
            'jetzt bestellen',
            'order now',
            'verfügbar',
            'available',
            'in den warenkorb',
            'add to cart'
        ];

        const htmlLower = html.toLowerCase();

        // Check for availability indicators
        const hasAvailableKeywords = availableKeywords.some(keyword => 
            htmlLower.includes(keyword)
        );

        const hasUnavailableKeywords = unavailableKeywords.some(keyword => 
            htmlLower.includes(keyword)
        );

        // If we find unavailable keywords, tickets are likely not available
        if (hasUnavailableKeywords && !hasAvailableKeywords) {
            return false;
        }

        // If we find available keywords and no unavailable ones, tickets are likely available
        if (hasAvailableKeywords && !hasUnavailableKeywords) {
            return true;
        }

        // Default to not available if unclear
        return false;
    }

    /**
     * Send notification when tickets become available
     * @param {Object} event - Event object
     */
    async sendTicketNotification(event) {
        try {
            console.log(`📧 Sending notification for: ${event.name}`);
            
            // This is a placeholder - in a real implementation, this would use nodemailer
            // to send actual email notifications
            
            const notification = {
                to: 'user@example.com', // This would come from user preferences
                subject: `🎫 Tickets verfügbar: ${event.name}`,
                message: `Tickets sind jetzt verfügbar für ${event.name}!\n\nVenue: ${event.venue}\nURL: ${event.url}\n\nJetzt schnell zugreifen!`,
                timestamp: new Date().toISOString()
            };

            console.log('📧 Notification prepared:', notification);
            
            // TODO: Implement actual email sending with nodemailer
            
        } catch (error) {
            console.error('❌ Error sending notification:', error.message);
        }
    }

    /**
     * Get random user agent to avoid detection
     * @returns {string} - Random user agent string
     */
    getRandomUserAgent() {
        const userAgents = config.monitoring.userAgents;
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    /**
     * Add delay between requests
     * @param {number} ms - Milliseconds to delay
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Add event to monitoring list
     * @param {Object} event - Event to monitor
     */
    addEvent(event) {
        this.monitoredEvents.push({
            ...event,
            id: event.id || Date.now(),
            status: 'monitoring',
            available: false,
            createdAt: new Date().toISOString()
        });
    }

    /**
     * Remove event from monitoring
     * @param {number} eventId - Event ID to remove
     */
    removeEvent(eventId) {
        this.monitoredEvents = this.monitoredEvents.filter(event => event.id !== eventId);
    }

    /**
     * Get all monitored events
     * @returns {Array} - Array of monitored events
     */
    getEvents() {
        return this.monitoredEvents;
    }
}

module.exports = new TicketService();