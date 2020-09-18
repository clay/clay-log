function wrap(func, levels = []) {
  levels = new Set(levels);

  return function (logger) {
    Object.keys(logger.levels.values)
      .filter(level => levels.has(level) || levels.size == 0)
      .filter(level => logger[level].name !== 'noop')
      .forEach((level) => {
        const _level = logger[level];
        logger[level] = function(data, msg) {
            func(data, msg);
            return _level.apply(logger, [data, msg]);
        }
      });
    return logger;
  };
}

module.exports = {
  wrap
}
