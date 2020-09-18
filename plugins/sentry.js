'use strict';

const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  onunhandledrejection: false
});

function wrapper(logger) {
  const _error = logger.error;
  logger.error = function(data, msg) {
    if (msg instanceof Error) {
      Sentry.captureException(msg, { extra: data });
    } else {
      const err = new Error(msg);
      err.stack = data instanceof Object ? data.stack : '';
      Sentry.captureException(err, { extra: data });
    }
    return _error.apply(logger, [data, msg]);
  };
  return logger;
}

module.exports = wrapper;
