/**
 * Logging utilities for Firebase Cloud Functions
 */

import { logger } from "firebase-functions";

export interface LogContext {
  functionName: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

/**
 * Log info message with context
 */
export const logInfo = (message: string, context?: LogContext): void => {
  logger.info(message, context);
};

/**
 * Log error message with context
 */
export const logError = (message: string, error: Error, context?: LogContext): void => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

/**
 * Log warning message with context
 */
export const logWarning = (message: string, context?: LogContext): void => {
  logger.warn(message, context);
};

/**
 * Log debug message with context (only in development)
 */
export const logDebug = (message: string, context?: LogContext): void => {
  if (process.env.NODE_ENV === "development") {
    logger.debug(message, context);
  }
};