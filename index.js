'use strict';

var pino = require('pino'), // Can be overwritten for testing
  logger; // Will be overwritten during setup

/**
 * Initialize the logger.
 *
 * @param  {Object} args
 * @return {Function}
 */
function init(args) {
  if (!args || !Object.keys(args).length || !args.name) {
    throw new Error('Init must be called with `name` property');
  }

  let { name = '', prettyPrint = false, meta = undefined } = args,
    output = process.stdout;

  if (prettyPrint) {
    output = pino.pretty({
      levelFirst: true
    });
    output.pipe(process.stdout);
  }

  // Set the logger
  logger = pino({
    name
  }, output);

  // If meta data was passed in for all logging, let's add it
  if (meta && Object.keys(meta).length) {
    logger = logger.child(meta);
  }

  return log(logger);
}

/**
 * Return a new logging instance with associated metadata
 * on each log line
 *
 * @param  {Object} options
 * @return {Function}
 */
function meta(options) {
  if (options && Object.keys(options).length) {
    return log(logger.child(options));
  }

  throw new Error('Clay Log: `meta` function requires object argument');
}

/**
 * Return an instance of a logger which is ready to be
 * used. Errors get logged as errors, otherwise you need to
 * call the appropriate level
 *
 * i.e. log('info', 'some message', { otherData: 1});
 *
 * @param  {Object} instanceLog
 * @return {Function}
 */
function log(instanceLog) {
  return function (level, msg, data = {}) {
    if (level instanceof Error) {
      msg = level;
      level = 'error';
    }

    if (!level || !msg) {d
      instanceLog.error(new Error('level or msg arguments required'));
      return;
    }

    instanceLog.level = level; // Make sure level is set each time
    instanceLog[level](data, msg);
  };
}

/**
 * [setLogger description]
 * @param {[type]} overwrite [description]
 */
function setLogger(overwrite) {
  pino = overwrite;
}

module.exports.init = init;
module.exports.meta = meta;

// For testing
module.exports.log = log;
module.exports.setLogger = setLogger;
