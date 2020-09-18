'use strict';

const v8 = require('v8');

function wrapper(logger) {
  Object.keys(logger.levels.values)
    .filter(level => logger[level].name !== 'noop')
    .forEach((level) => {
      const _level = logger[level];
      logger[level] = function(data, msg) {
        data = Object.assign(data, v8.getHeapStatistics());
        return _level.apply(logger, [data, msg]);
      };
    });
  return logger;
}

module.exports = wrapper;
