/**
 * Centralized Logging Utility
 * Provides structured logging with environment-aware log levels
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const currentLevel = process.env.NODE_ENV === 'production'
    ? LOG_LEVELS.WARN
    : LOG_LEVELS.DEBUG;

const formatMessage = (level, component, message, ...args) => {
    const timestamp = new Date().toISOString();
    const prefix = component ? `[${level}][${component}]` : `[${level}]`;
    return { timestamp, prefix, message, args };
};

export const logger = {
    debug: (component, message, ...args) => {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            const { prefix } = formatMessage('DEBUG', component, message, ...args);
            console.log(prefix, message, ...args);
        }
    },

    info: (component, message, ...args) => {
        if (currentLevel <= LOG_LEVELS.INFO) {
            const { prefix } = formatMessage('INFO', component, message, ...args);
            console.log(prefix, message, ...args);
        }
    },

    warn: (component, message, ...args) => {
        if (currentLevel <= LOG_LEVELS.WARN) {
            const { prefix } = formatMessage('WARN', component, message, ...args);
            console.warn(prefix, message, ...args);
        }
    },

    error: (component, message, ...args) => {
        const { prefix } = formatMessage('ERROR', component, message, ...args);
        console.error(prefix, message, ...args);
    }
};

// Convenience method for creating component-specific loggers
export const createLogger = (component) => ({
    debug: (msg, ...args) => logger.debug(component, msg, ...args),
    info: (msg, ...args) => logger.info(component, msg, ...args),
    warn: (msg, ...args) => logger.warn(component, msg, ...args),
    error: (msg, ...args) => logger.error(component, msg, ...args)
});
