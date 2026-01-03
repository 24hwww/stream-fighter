/**
 * Centralized Logger for Stream Socket
 * Provides structured logging with levels, timestamps, and context
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const LOG_COLORS = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m'
};

class Logger {
    constructor(context = 'APP', minLevel = 'INFO') {
        this.context = context;
        this.minLevel = LOG_LEVELS[minLevel] || LOG_LEVELS.INFO;
    }

    _formatTimestamp() {
        const now = new Date();
        return now.toISOString();
    }

    _shouldLog(level) {
        return LOG_LEVELS[level] >= this.minLevel;
    }

    _log(level, message, ...args) {
        if (!this._shouldLog(level)) return;

        const timestamp = this._formatTimestamp();
        const color = LOG_COLORS[level];
        const reset = LOG_COLORS.RESET;
        const prefix = `${color}[${timestamp}] [${level}] [${this.context}]${reset}`;

        if (args.length > 0) {
            console.log(prefix, message, ...args);
        } else {
            console.log(prefix, message);
        }
    }

    debug(message, ...args) {
        this._log('DEBUG', message, ...args);
    }

    info(message, ...args) {
        this._log('INFO', message, ...args);
    }

    warn(message, ...args) {
        this._log('WARN', message, ...args);
    }

    error(message, ...args) {
        this._log('ERROR', message, ...args);
        if (args[0] instanceof Error) {
            console.error(args[0].stack);
        }
    }

    // Performance timing utility
    time(label) {
        console.time(`[${this.context}] ${label}`);
    }

    timeEnd(label) {
        console.timeEnd(`[${this.context}] ${label}`);
    }
}

/**
 * Create a logger instance
 * @param {string} context - Context name for the logger
 * @param {string} minLevel - Minimum log level (DEBUG, INFO, WARN, ERROR)
 * @returns {Logger}
 */
function createLogger(context, minLevel = process.env.LOG_LEVEL || 'INFO') {
    return new Logger(context, minLevel);
}

module.exports = { createLogger, Logger };
