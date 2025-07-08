const BaseModel = require('./BaseModel');

class TicketCheckHistory extends BaseModel {
    constructor(db) {
        super(db, 'ticket_check_history');
    }

    /**
     * Get history for a specific monitor
     */
    async getByMonitor(monitorId, limit = 50) {
        return await this.findAll(
            'monitor_id = ? ORDER BY timestamp DESC LIMIT ?',
            [monitorId, limit]
        );
    }

    /**
     * Get recent check history across all monitors
     */
    async getRecent(limit = 100) {
        const sql = `
            SELECT 
                tch.*,
                tm.name as monitor_name,
                tm.event_name
            FROM ticket_check_history tch
            INNER JOIN ticket_monitors tm ON tch.monitor_id = tm.id
            ORDER BY tch.timestamp DESC
            LIMIT ?
        `;
        
        return await this.db.all(sql, [limit]);
    }

    /**
     * Log a check result
     */
    async logCheck(monitorId, result) {
        const logData = {
            monitor_id: monitorId,
            status: result.status,
            http_response_code: result.httpResponseCode,
            response_time_ms: result.responseTime,
            error_message: result.errorMessage,
            content_found: result.contentFound ? 1 : 0,
            content_hash: result.contentHash,
            html_snapshot_path: result.htmlSnapshotPath,
            user_agent: result.userAgent,
            suspected_bot_detection: result.suspectedBotDetection ? 1 : 0,
            captcha_detected: result.captchaDetected ? 1 : 0,
            rate_limited: result.rateLimited ? 1 : 0
        };

        return await this.create(logData);
    }

    /**
     * Get statistics for a monitor
     */
    async getMonitorStats(monitorId, days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as total_checks,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
                COUNT(CASE WHEN status = 'unavailable' THEN 1 END) as unavailable_count,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
                AVG(response_time_ms) as avg_response_time,
                COUNT(CASE WHEN suspected_bot_detection = 1 THEN 1 END) as bot_detections,
                MIN(timestamp) as first_check,
                MAX(timestamp) as last_check
            FROM ticket_check_history 
            WHERE monitor_id = ? 
            AND timestamp > datetime('now', '-${days} days')
        `;
        
        return await this.db.get(sql, [monitorId]);
    }

    /**
     * Get availability timeline for a monitor
     */
    async getAvailabilityTimeline(monitorId, days = 7) {
        const sql = `
            SELECT 
                date(timestamp) as check_date,
                COUNT(*) as total_checks,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available_checks,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as error_checks
            FROM ticket_check_history 
            WHERE monitor_id = ? 
            AND timestamp > datetime('now', '-${days} days')
            GROUP BY date(timestamp)
            ORDER BY check_date DESC
        `;
        
        return await this.db.all(sql, [monitorId]);
    }

    /**
     * Get global statistics
     */
    async getGlobalStats(days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as total_checks,
                COUNT(DISTINCT monitor_id) as monitored_events,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as total_available,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as total_errors,
                AVG(response_time_ms) as avg_response_time,
                COUNT(CASE WHEN suspected_bot_detection = 1 THEN 1 END) as total_bot_detections
            FROM ticket_check_history 
            WHERE timestamp > datetime('now', '-${days} days')
        `;
        
        return await this.db.get(sql);
    }

    /**
     * Clean old history records
     */
    async cleanOldRecords(daysToKeep = 90) {
        const sql = `
            DELETE FROM ticket_check_history 
            WHERE timestamp < datetime('now', '-${daysToKeep} days')
        `;
        
        const result = await this.db.run(sql);
        return result.changes;
    }

    /**
     * Get error analysis
     */
    async getErrorAnalysis(days = 7) {
        const sql = `
            SELECT 
                error_message,
                http_response_code,
                COUNT(*) as error_count,
                COUNT(DISTINCT monitor_id) as affected_monitors
            FROM ticket_check_history 
            WHERE status = 'error' 
            AND timestamp > datetime('now', '-${days} days')
            AND error_message IS NOT NULL
            GROUP BY error_message, http_response_code
            ORDER BY error_count DESC
            LIMIT 20
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Get bot detection summary
     */
    async getBotDetectionSummary(days = 7) {
        const sql = `
            SELECT 
                COUNT(CASE WHEN suspected_bot_detection = 1 THEN 1 END) as suspected_detections,
                COUNT(CASE WHEN captcha_detected = 1 THEN 1 END) as captcha_detections,
                COUNT(CASE WHEN rate_limited = 1 THEN 1 END) as rate_limit_detections,
                COUNT(DISTINCT monitor_id) as affected_monitors
            FROM ticket_check_history 
            WHERE timestamp > datetime('now', '-${days} days')
            AND (suspected_bot_detection = 1 OR captcha_detected = 1 OR rate_limited = 1)
        `;
        
        return await this.db.get(sql);
    }
}

module.exports = TicketCheckHistory;