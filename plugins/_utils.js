const { noop } = require('pino/lib/tools');

function wrap(func, levels = []) {
  levels = new Set(levels);

  return function (logger) {
    Object.keys(logger.levels.values)
      .filter(level => levels.has(level) || levels.size == 0)
      .filter(level => logger[level] !== noop)
      .forEach((level) => {
        const _level = logger[level];
        logger[level] = function(data, msg) {
            func(data, msg);
            return _level.apply(logger, [data, msg]);
        }
        // Sinon needs to spy on the original function, not the wrapped function.
        // This conditional allows us to test if data was enriched.
        if (process.env.NODE_ENV === 'test') {
          logger[level]._original = _level;
        }
      });
    return logger;
  };
}

module.exports = {
  wrap
}
