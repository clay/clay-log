'use strict';

const Sentry = require('@sentry/node');

const { wrap } = require('./_utils');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  onunhandledrejection: false
});

/**
 * The log data to send along with a Sentry event. The Error is sent as the
 * event's exception, so it is left out of the data rather than sent twice.
 *
 * @param {object} data: The data that was logged.
 * @param {Error} err: The Error being reported.
 * @returns {object}
 */
function extraFor(data, err) {
  if (!(data instanceof Object)) {
    return data;
  }

  const extra = Object.assign({}, data);

  if (extra.error === err) {
    delete extra.error;
  }

  return extra;
}

/**
 * Reports error-level logs to Sentry.
 *
 * An Error is reported as is, so Sentry keeps its stack and `cause` chain.
 * That is an Error passed as the message, or as `data.error` next to a message.
 *
 * @param {object} data: The data to report. May hold the Error under `error`.
 * @param {string|Error} msg: The log message, or the Error itself.
 */
function wrapper(data, msg) {
  if (msg instanceof Error) {
    Sentry.captureException(msg, { extra: extraFor(data, msg) });
  } else if (data instanceof Object && data.error instanceof Error) {
    // keep the log message too, since the exception has its own
    Sentry.captureException(data.error, { extra: Object.assign({ msg }, extraFor(data, data.error)) });
  } else {
    const err = new Error(msg);
    err.stack = data instanceof Object ? data.stack : '';
    Sentry.captureException(err, { extra: data });
  }
}

module.exports = wrap(wrapper, ['error']);
