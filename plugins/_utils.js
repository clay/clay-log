function wrap(logger, levels, func) {
  levels = new Set(levels);

  Object.keys(logger.levels.values)
    .filter(levels.has)
    .filter(level => logger[level].name !== 'noop')
    .forEach((level) => {
      const _level = logger[level];
      logger[level] = function(data, msg) {
          func(data, msg);
          return _level.apply(logger, [data, msg]);
      }
    });
  return logger;
}
