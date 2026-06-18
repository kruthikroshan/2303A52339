/**
 * Frontend Logging Service
 * Mirrors the backend logging middleware interface for consistent logging
 */

class FrontendLogger {
    constructor(options = {}) {
        this.logLevel = options.logLevel || 'INFO';
        this.enableConsole = options.enableConsole !== false;
        this.enableLocalStorage = options.enableLocalStorage !== false;
        this.maxStoredLogs = options.maxStoredLogs || 100;
        
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            FATAL: 4
        };
        
        this.currentLogLevel = this.levels[this.logLevel] || this.levels.INFO;
        this.logs = [];
        this.loadStoredLogs();
    }
    
    formatLog(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const context = data.context || 'FRONTEND';
        
        return {
            timestamp,
            level,
            context,
            message,
            data: { ...data },
            formattedMessage: `[${timestamp}] [${level}] [${context}] ${message}`
        };
    }
    
    writeToConsole(formattedLog) {
        if (!this.enableConsole) return;
        
        const colors = {
            DEBUG: '%cDEBUG',
            INFO: '%cINFO',
            WARN: '%cWARN',
            ERROR: '%cERROR',
            FATAL: '%cFATAL'
        };
        
        const styles = {
            DEBUG: 'color: #36f; font-weight: bold',
            INFO: 'color: #2d2; font-weight: bold',
            WARN: 'color: #d92; font-weight: bold',
            ERROR: 'color: #d22; font-weight: bold',
            FATAL: 'color: #c2c; font-weight: bold'
        };
        
        const dataStr = formattedLog.data && Object.keys(formattedLog.data).length > 0 
            ? ' | ' + JSON.stringify(formattedLog.data)
            : '';
        
        console.log(
            `%c${formattedLog.timestamp} ${colors[formattedLog.level]} %c[${formattedLog.context}] ${formattedLog.message}${dataStr}`,
            'color: #999',
            styles[formattedLog.level]
        );
    }
    
    writeToStorage(formattedLog) {
        if (!this.enableLocalStorage) return;
        
        this.logs.push(formattedLog);
        
        if (this.logs.length > this.maxStoredLogs) {
            this.logs.shift();
        }
        
        try {
            localStorage.setItem('appLogs', JSON.stringify(this.logs));
        } catch (error) {
            console.warn('Failed to store logs:', error);
        }
    }
    
    loadStoredLogs() {
        try {
            const stored = localStorage.getItem('appLogs');
            this.logs = stored ? JSON.parse(stored) : [];
        } catch (error) {
            this.logs = [];
        }
    }
    
    log(level, message, data = {}) {
        if (this.levels[level] < this.currentLogLevel) return;
        const formattedLog = this.formatLog(level, message, data);
        this.writeToConsole(formattedLog);
        this.writeToStorage(formattedLog);
    }
    
    debug(message, data = {}) { this.log('DEBUG', message, data); }
    info(message, data = {}) { this.log('INFO', message, data); }
    warn(message, data = {}) { this.log('WARN', message, data); }
    error(message, data = {}) { this.log('ERROR', message, data); }
    fatal(message, data = {}) { this.log('FATAL', message, data); }
    
    logComponentLifecycle(componentName, event, data = {}) {
        this.debug(`${componentName} ${event}`, { context: 'COMPONENT_LIFECYCLE', component: componentName, event, ...data });
    }
    
    logAPICall(method, url, statusCode, duration, data = {}) {
        this.info(`API ${method} ${url}`, { context: 'API_CALL', method, url, statusCode, durationMs: duration, ...data });
    }
    
    logAPIError(method, url, error, data = {}) {
        this.error(`API ${method} ${url}`, { context: 'API_ERROR', method, url, error: error.message, ...data });
    }
    
    logUserAction(action, details = {}) {
        this.info(`User: ${action}`, { context: 'USER_ACTION', action, ...details });
    }
    
    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLogLevel = this.levels[level];
        }
    }
    
    getLogs() { return [...this.logs]; }
    clearLogs() { this.logs = []; localStorage.removeItem('appLogs'); }
}

export default new FrontendLogger();
