'use strict';

const Sentry = require('@sentry/node');

const { wrap } = require('./_utils');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  onunhandledrejection: false
});

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
