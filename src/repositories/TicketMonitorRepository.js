const { models } = require('../database/models');

/**
 * Repository for managing ticket monitors
 * Provides high-level business logic for monitor operations
 */
class TicketMonitorRepository {
    constructor() {
        this.ticketMonitor = models.TicketMonitor;
        this.checkHistory = models.TicketCheckHistory;
        this.emailSettings = models.EmailSettings;
        this.category = models.EventCategory;
    }

    /**
     * Create a new ticket monitor
     */
    async createMonitor(monitorData) {
        // Validate required fields
        if (!monitorData.name || !monitorData.event_url) {
            throw new Error('Monitor name and event URL are required');
        }

        // Set default values
        const data = {
            search_text: 'ausverkauft',
            status: 'active',
            check_interval: 300000, // 5 minutes
            max_retries: 3,
            timeout: 30000,
            current_status: 'unknown',
            ...monitorData
        };

        return await this.ticketMonitor.create(data);
    }

    /**
     * Get all monitors with details for a user
     */
    async getMonitorsForUser(userId = null) {
        const where = userId ? 'tm.user_id = ? OR tm.user_id IS NULL' : '1=1';
        const params = userId ? [userId] : [];
        return await this.ticketMonitor.getWithDetails(where, params);
    }

    /**
     * Get active monitors ready for checking
     */
    async getActiveMonitors() {
        return await this.ticketMonitor.getMonitorsToCheck();
    }

    /**
     * Update monitor after a check
     */
    async updateAfterCheck(monitorId, checkResult) {
        // Update monitor status
        await this.ticketMonitor.updateLastCheck(monitorId, checkResult.status);

        // Log the check result
        await this.checkHistory.logCheck(monitorId, checkResult);

        return await this.ticketMonitor.getByIdWithDetails(monitorId);
    }

    /**
     * Get monitor statistics dashboard
     */
    async getDashboardStats() {
        const monitorStats = await this.ticketMonitor.getStats();
        const globalCheckStats = await this.checkHistory.getGlobalStats();
        
        return {
            monitors: monitorStats,
            checks: globalCheckStats,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Get detailed monitor information
     */
    async getMonitorDetails(monitorId) {
        const monitor = await this.ticketMonitor.getByIdWithDetails(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }

        const recentChecks = await this.checkHistory.getByMonitor(monitorId, 20);
        const checkStats = await this.checkHistory.getMonitorStats(monitorId);
        const timeline = await this.checkHistory.getAvailabilityTimeline(monitorId);

        return {
            monitor,
            recentChecks,
            stats: checkStats,
            timeline
        };
    }

    /**
     * Toggle monitor status
     */
    async toggleMonitorStatus(monitorId) {
        const monitor = await this.ticketMonitor.findById(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }

        const newStatus = monitor.status === 'active' ? 'inactive' : 'active';
        return await this.ticketMonitor.updateStatus(monitorId, newStatus);
    }

    /**
     * Delete monitor and all related data
     */
    async deleteMonitor(monitorId) {
        // Check if monitor exists
        const monitor = await this.ticketMonitor.findById(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }

        // Delete the monitor (cascade will handle related records)
        const deleted = await this.ticketMonitor.delete(monitorId);
        
        if (!deleted) {
            throw new Error('Failed to delete monitor');
        }

        return { success: true, deletedMonitor: monitor };
    }

    /**
     * Search monitors
     */
    async searchMonitors(query, userId = null) {
        let monitors = await this.ticketMonitor.search(query);
        
        // Filter by user if specified
        if (userId) {
            monitors = monitors.filter(m => !m.user_id || m.user_id === userId);
        }
        
        return monitors;
    }

    /**
     * Get monitors by category
     */
    async getMonitorsByCategory(categoryId) {
        return await this.ticketMonitor.getByCategory(categoryId);
    }

    /**
     * Clone an existing monitor
     */
    async cloneMonitor(monitorId, newName, userId = null) {
        const cloned = await this.ticketMonitor.clone(monitorId, newName);
        
        if (userId) {
            await this.ticketMonitor.update(cloned.id, { user_id: userId });
        }
        
        return await this.ticketMonitor.getByIdWithDetails(cloned.id);
    }

    /**
     * Bulk update monitor statuses
     */
    async bulkUpdateStatus(monitorIds, status) {
        const results = [];
        
        for (const id of monitorIds) {
            const updated = await this.ticketMonitor.updateStatus(id, status);
            results.push(updated);
        }
        
        return results;
    }

    /**
     * Get email settings for a monitor
     */
    async getEmailSettingsForMonitor(monitorId) {
        return await this.emailSettings.getForMonitor(monitorId);
    }
}

module.exports = TicketMonitorRepository;