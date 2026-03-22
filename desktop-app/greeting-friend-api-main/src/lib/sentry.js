// src/lib/sentry.js
import * as Sentry from "@sentry/electron/renderer";

/**
 * Set user context for Sentry error tracking
 * @param {Object} user - User object from Supabase auth
 * @param {string} orgId - Current organization ID
 */
export function setSentryUser(user, orgId) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.user_metadata?.full_name || user.email,
  });

  Sentry.setContext("organization", {
    org_id: orgId,
  });
}

/**
 * Set additional context for debugging
 * @param {string} key - Context key
 * @param {Object} data - Context data
 */
export function setSentryContext(key, data) {
  Sentry.setContext(key, data);
}

/**
 * Capture an exception manually
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    contexts: context,
  });
}

/**
 * Capture a message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export function captureMessage(message, level = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, data = {}) {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}
