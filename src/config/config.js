module.exports = {
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },
    
    email: {
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        from: process.env.SMTP_USER || 'ticketbot@example.com',
        templates: {
            ticketAlert: 'ticket-available'
        }
    },
    
    database: {
        type: process.env.DB_TYPE || 'sqlite',
        sqlite: {
            path: process.env.DB_PATH || './ticketbot.db'
        },
        postgresql: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'ticketbot',
            username: process.env.DB_USER || 'ticketbot_user',
            password: process.env.DB_PASS || ''
        }
    },
    
    monitoring: {
        interval: parseInt(process.env.MONITORING_INTERVAL) || 300000, // 5 minutes
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
    },
    
    security: {
        secretKey: process.env.SECRET_KEY || 'default_secret_key',
        rateLimit: parseInt(process.env.RATE_LIMIT) || 100
    },
    
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/ticketbot.log'
    }
};