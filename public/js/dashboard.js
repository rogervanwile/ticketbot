// Dashboard JavaScript for TicketBot
class TicketBotDashboard {
    constructor() {
        this.baseUrl = window.location.origin;
        this.refreshInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        this.loadStats();
        this.loadEvents();
        this.startAutoRefresh();
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/stats`);
            const stats = await response.json();
            
            this.updateStatCard('total-events', stats.totalEvents || 0);
            this.updateStatCard('available-tickets', stats.availableTickets || 0);
            this.updateStatCard('emails-sent', stats.emailsSent || 0);
            this.updateStatCard('uptime', this.formatUptime(stats.uptime || 0));
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadEvents() {
        try {
            const response = await fetch(`${this.baseUrl}/api/events`);
            const data = await response.json();
            
            this.renderEvents(data.events || []);
        } catch (error) {
            console.error('Error loading events:', error);
            this.renderEventsError();
        }
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    renderEvents(events) {
        const container = document.getElementById('events-list');
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    No events are currently being monitored.
                    <br><small>Add events via the API to start monitoring.</small>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="event-card">
                <div class="event-header">
                    <div class="event-name">${this.escapeHtml(event.name)}</div>
                    <div class="event-status status-${event.available ? 'available' : 'monitoring'}">
                        ${event.available ? '✅ Available' : '🔍 Monitoring'}
                    </div>
                </div>
                <div class="event-details">
                    <div><strong>Venue:</strong> ${this.escapeHtml(event.venue || 'Unknown')}</div>
                    <div><strong>Date:</strong> ${event.date ? new Date(event.date).toLocaleDateString('de-DE') : 'TBD'}</div>
                    <div><strong>Last Check:</strong> ${event.lastChecked ? this.formatRelativeTime(event.lastChecked) : 'Never'}</div>
                    <div><strong>Status:</strong> ${event.status || 'Unknown'}</div>
                </div>
            </div>
        `).join('');
    }

    renderEventsError() {
        const container = document.getElementById('events-list');
        container.innerHTML = `
            <div class="loading" style="color: #e74c3c;">
                ❌ Error loading events. Please check the server connection.
            </div>
        `;
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadStats();
            this.loadEvents();
        }, this.refreshInterval);

        // Add visual indicator for last refresh
        this.addRefreshIndicator();
    }

    addRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        indicator.innerHTML = '🔄 Auto-refresh: 30s';
        document.body.appendChild(indicator);

        setInterval(() => {
            indicator.innerHTML = `🔄 Last update: ${new Date().toLocaleTimeString('de-DE')}`;
        }, this.refreshInterval);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicketBotDashboard();
});

// Add service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}