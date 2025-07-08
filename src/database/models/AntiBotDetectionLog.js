const BaseModel = require('./BaseModel');

class AntiBotDetectionLog extends BaseModel {
    constructor(db) {
        super(db, 'anti_bot_detection_logs');
    }

    /**
     * Log a bot detection event
     */
    async logDetection(monitorId, detectionData) {
        const logData = {
            monitor_id: monitorId,
            detection_type: detectionData.type,
            severity: detectionData.severity || 'medium',
            http_status_code: detectionData.httpStatusCode,
            response_headers: detectionData.responseHeaders ? JSON.stringify(detectionData.responseHeaders) : null,
            page_title: detectionData.pageTitle,
            error_indicators: detectionData.errorIndicators ? JSON.stringify(detectionData.errorIndicators) : null,
            countermeasure_applied: detectionData.countermeasureApplied,
            user_agent_rotated: detectionData.userAgentRotated ? 1 : 0,
            delay_increased: detectionData.delayIncreased ? 1 : 0,
            proxy_switched: detectionData.proxySwitched ? 1 : 0,
            url: detectionData.url,
            referrer: detectionData.referrer,
            notes: detectionData.notes
        };

        return await this.create(logData);
    }

    /**
     * Get recent detections
     */
    async getRecent(limit = 50) {
        const sql = `
            SELECT 
                abdl.*,
                tm.name as monitor_name,
                tm.event_name
            FROM anti_bot_detection_logs abdl
            INNER JOIN ticket_monitors tm ON abdl.monitor_id = tm.id
            ORDER BY abdl.timestamp DESC
            LIMIT ?
        `;
        
        return await this.db.all(sql, [limit]);
    }

    /**
     * Get detections by monitor
     */
    async getByMonitor(monitorId, limit = 30) {
        return await this.findAll(
            'monitor_id = ? ORDER BY timestamp DESC LIMIT ?',
            [monitorId, limit]
        );
    }

    /**
     * Get unresolved detections
     */
    async getUnresolved() {
        const sql = `
            SELECT 
                abdl.*,
                tm.name as monitor_name,
                tm.event_name
            FROM anti_bot_detection_logs abdl
            INNER JOIN ticket_monitors tm ON abdl.monitor_id = tm.id
            WHERE abdl.resolved = 0
            AND abdl.severity IN ('high', 'critical')
            ORDER BY abdl.timestamp DESC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Mark detection as resolved
     */
    async markResolved(id, resolutionMethod, notes = '') {
        return await this.update(id, {
            resolved: 1,
            resolved_at: new Date().toISOString(),
            resolution_method: resolutionMethod,
            notes: notes
        });
    }

    /**
     * Get detection statistics
     */
    async getStats(days = 30) {
        const sql = `
            SELECT 
                COUNT(*) as total_detections,
                COUNT(CASE WHEN resolved = 1 THEN 1 END) as resolved_count,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN detection_type = 'captcha' THEN 1 END) as captcha_count,
                COUNT(CASE WHEN detection_type = 'rate_limit' THEN 1 END) as rate_limit_count,
                COUNT(DISTINCT monitor_id) as affected_monitors
            FROM anti_bot_detection_logs 
            WHERE timestamp > datetime('now', '-${days} days')
        `;
        
        return await this.db.get(sql);
    }

    /**
     * Get detection trends by type
     */
    async getDetectionTrends(days = 7) {
        const sql = `
            SELECT 
                date(timestamp) as detection_date,
                detection_type,
                COUNT(*) as count
            FROM anti_bot_detection_logs 
            WHERE timestamp > datetime('now', '-${days} days')
            GROUP BY date(timestamp), detection_type
            ORDER BY detection_date DESC, count DESC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Get most problematic monitors
     */
    async getProblematicMonitors(days = 30) {
        const sql = `
            SELECT 
                tm.id,
                tm.name as monitor_name,
                tm.event_name,
                tm.event_url,
                COUNT(*) as detection_count,
                COUNT(CASE WHEN abdl.severity IN ('high', 'critical') THEN 1 END) as severe_count,
                MAX(abdl.timestamp) as last_detection
            FROM anti_bot_detection_logs abdl
            INNER JOIN ticket_monitors tm ON abdl.monitor_id = tm.id
            WHERE abdl.timestamp > datetime('now', '-${days} days')
            GROUP BY tm.id
            ORDER BY detection_count DESC, severe_count DESC
            LIMIT 10
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Get countermeasure effectiveness
     */
    async getCountermeasureStats(days = 30) {
        const sql = `
            SELECT 
                countermeasure_applied,
                COUNT(*) as times_applied,
                COUNT(CASE WHEN resolved = 1 THEN 1 END) as successful_resolutions,
                ROUND(
                    COUNT(CASE WHEN resolved = 1 THEN 1 END) * 100.0 / COUNT(*), 
                    2
                ) as success_rate
            FROM anti_bot_detection_logs 
            WHERE timestamp > datetime('now', '-${days} days')
            AND countermeasure_applied IS NOT NULL
            GROUP BY countermeasure_applied
            ORDER BY success_rate DESC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Clean old detection logs
     */
    async cleanOldLogs(daysToKeep = 90) {
        const sql = `
            DELETE FROM anti_bot_detection_logs 
            WHERE timestamp < datetime('now', '-${daysToKeep} days')
            AND resolved = 1
        `;
        
        const result = await this.db.run(sql);
        return result.changes;
    }
}

module.exports = AntiBotDetectionLog;