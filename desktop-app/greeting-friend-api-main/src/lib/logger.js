// src/lib/logger.js
/**
 * Logger utility per il sistema ricambi MVP
 * Fornisce logging strutturato con livelli di log
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

class Logger {
  constructor(name = 'SparePartsMVP') {
    this.name = name;
  }

  log(level, message, ...args) {
    if (level <= currentLevel) {
      const timestamp = new Date().toISOString();
      const levelName = Object.keys(LOG_LEVELS)[level];
      const prefix = `[${timestamp}] ${levelName} [${this.name}]`;
      
      if (level === LOG_LEVELS.ERROR) {
        console.error(prefix, message, ...args);
      } else if (level === LOG_LEVELS.WARN) {
        console.warn(prefix, message, ...args);
      } else if (level === LOG_LEVELS.INFO) {
        console.info(prefix, message, ...args);
      } else {
        console.log(prefix, message, ...args);
      }
    }
  }

  error(message, ...args) {
    this.log(LOG_LEVELS.ERROR, message, ...args);
  }

  warn(message, ...args) {
    this.log(LOG_LEVELS.WARN, message, ...args);
  }

  info(message, ...args) {
    this.log(LOG_LEVELS.INFO, message, ...args);
  }

  debug(message, ...args) {
    this.log(LOG_LEVELS.DEBUG, message, ...args);
  }
}

// Logger di default
export const logger = new Logger();

// Factory per creare logger specifici
export const createLogger = (name) => new Logger(name);

// Utility per logging di errori
export const logError = (error, context = '') => {
  logger.error(`${context}:`, error);
  if (error.stack) {
    logger.debug('Stack trace:', error.stack);
  }
};

// Utility per logging di performance
export const logPerformance = (operation, startTime) => {
  const duration = Date.now() - startTime;
  logger.debug(`${operation} completed in ${duration}ms`);
};

export default logger;