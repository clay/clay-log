'use strict';

var pino = require('pino'), // Can be overwritten for testing
  logger; // Will be overwritten during setup

/**
 * allow passing in a different output to stream to
 * note: this is used by tools that want to output logs to stderr rather than stdout
 * @param  {Object} args
 * @return {stream}
 */
function getOutput(args) {
  return args.output || process.stdout;
}

/**
 * determine whether to pretty-print logs
 * @param  {Object} args
 * @return {Boolean}
 */
function getPrettyPrint(args) {
  return args.pretty || process.env.CLAY_LOG_PRETTY && (process.versions && process.versions.node);
}

/**
 * check args to make sure they exist and have a `name` property
 * @param  {object} args
 */
function checkArgs(args) {
  if (!args || !Object.keys(args).length || !args.name) {
    throw new Error('Init must be called with `name` property');
  }
}

/**
 * Initialize the logger.
 *
 * @param  {Object} args
 * @return {Function}
 */
function init(args) {
  var output, stream, pretty, name, meta;

  checkArgs(args);

  output = getOutput(args);
  stream = getOutput(args);
  pretty = getPrettyPrint(args);
  name = args.name;
  meta = args.meta || undefined;

  if (pretty) {
    output = pino.pretty({ levelFirst: true });
    output.pipe(stream);
  }

  // Set the logger. The minimum allowed
  // level is set via an env var called `LOG`
  logger = pino({
    name: name,
    level: process.env.LOG || 'info'
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
 * @param  {Object} logInstance
 * @return {Function}
 */
function meta(options, logInstance) {
  var fork = logInstance || logger;

  if (options && Object.keys(options).length) {
    return log(fork.child(options));
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
  return function (level, msg, data) {
    data = data || {};

    if (level instanceof Error) {
      msg = level;
      level = 'error';
    }

    if (!level || !msg) {
      instanceLog.error(new Error('level or msg arguments required'));
      return;
    }

    // Assign the _label
    data._label = level.toUpperCase();
    // Log it
    instanceLog[level](data, msg);
  };
}

/**
 * Overwrites Pino package with stub for testing
 *
 * @param {Object} overwrite
 */
function setLogger(overwrite) {
  pino = overwrite;
}

/**
 * Returns the in-memorey logging instance
 * @return {Object}
 */
function getLogger() {
  return logger;
}

module.exports.init = init;
module.exports.meta = meta;
module.exports.getLogger = getLogger;

// For testing
module.exports.log = log;
module.exports.setLogger = setLogger;
