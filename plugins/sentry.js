'use strict';

const Sentry = require('@sentry/node');

const { wrap } = require('./_utils');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  onunhandledrejection: false
});

/**
 * Reports error-level logs to Sentry.
 *
 * @param {object} data: The Error or data to report.
 * @param {string} msg: The name of the Error.
 */
function wrapper(data, msg) {
  if (msg instanceof Error) {
    Sentry.captureException(msg, { extra: data });
  } else {
    const err = new Error(msg);
    err.stack = data instanceof Object ? data.stack : '';
    Sentry.captureException(err, { extra: data });
  }
}

module.exports = wrap(wrapper, ['error']);
