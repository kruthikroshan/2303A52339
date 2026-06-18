/**
 * Logging Middleware for Notification Platform
 * Provides structured logging with log levels, timestamps, and context tracking
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.logDir = options.logDir || path.join(__dirname, '../logs');
        this.logLevel = options.logLevel || 'INFO';
        this.includeConsole = options.includeConsole !== false;
        this.includeFile = options.includeFile !== false;
        
        // Ensure log directory exists
        if (this.includeFile && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        // Log levels
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            FATAL: 4
        };
        
        this.currentLogLevel = this.levels[this.logLevel] || this.levels.INFO;
    }
    
    /**
     * Format log message with timestamp, level, and context
     */
    formatLog(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const context = data.context || 'GENERAL';
        const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
        
        return {
            timestamp,
            level,
            context,
            message,
            data: dataStr,
            formattedMessage: `[${timestamp}] [${level}] [${context}] ${message}${dataStr ? ' | ' + dataStr : ''}`
        };
    }
    
    /**
     * Write log to file
     */
    writeToFile(formattedLog) {
        if (!this.includeFile) return;
        
        try {
            const logFile = path.join(this.logDir, `notification-platform-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, formattedLog.formattedMessage + '\n');
        } catch (error) {
            // Fail silently to avoid infinite loop
            console.error('Failed to write to log file:', error.message);
        }
    }
    
    /**
     * Write log to console
     */
    writeToConsole(formattedLog) {
        if (!this.includeConsole) return;
        
        const colors = {
            DEBUG: '\x1b[36m',      // Cyan
            INFO: '\x1b[32m',       // Green
            WARN: '\x1b[33m',       // Yellow
            ERROR: '\x1b[31m',      // Red
            FATAL: '\x1b[35m'       // Magenta
        };
        const reset = '\x1b[0m';
        
        const color = colors[formattedLog.level] || '';
        console.log(color + formattedLog.formattedMessage + reset);
    }
    
    /**
     * Core logging function
     */
    log(level, message, data = {}) {
        if (this.levels[level] < this.currentLogLevel) {
            return; // Skip logs below current level
        }
        
        const formattedLog = this.formatLog(level, message, data);
        this.writeToConsole(formattedLog);
        this.writeToFile(formattedLog);
    }
    
    debug(message, data = {}) {
        this.log('DEBUG', message, data);
    }
    
    info(message, data = {}) {
        this.log('INFO', message, data);
    }
    
    warn(message, data = {}) {
        this.log('WARN', message, data);
    }
    
    error(message, data = {}) {
        this.log('ERROR', message, data);
    }
    
    fatal(message, data = {}) {
        this.log('FATAL', message, data);
    }
    
    /**
     * Log API requests
     */
    logRequest(method, url, statusCode, responseTime, data = {}) {
        this.info(`API Request`, {
            ...data,
            context: 'API_REQUEST',
            method,
            url,
            statusCode,
            responseTimeMs: responseTime
        });
    }
    
    /**
     * Log function entry/exit for tracing
     */
    logFunctionEntry(functionName, args = {}) {
        this.debug(`Entering function: ${functionName}`, {
            context: 'FUNCTION_TRACE',
            functionName,
            args
        });
    }
    
    logFunctionExit(functionName, result = {}) {
        this.debug(`Exiting function: ${functionName}`, {
            context: 'FUNCTION_TRACE',
            functionName,
            result
        });
    }
    
    /**
     * Set log level dynamically
     */
    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.currentLogLevel = this.levels[level];
        }
    }
}

// Export singleton instance
module.exports = new Logger();

// Also export class for custom configurations
module.exports.Logger = Logger;
