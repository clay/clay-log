'use strict';

const pino = require('pino');

var logger; // Will be overwritten during setup

/**
 * [init description]
 * @param  {String} [name='' }]            [description]
 * @return {[type]}          [description]
 */
function init({ name = '', prettyPrint = false, meta = undefined }) {
  let output = process.stdout;

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
 * [meta description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function meta(options) {
  if (options && Object.keys(options).length) {
    return log(logger.child(options));
  }

  return log(logger);
}

/**
 * Call the proper log level
 * @param  {[type]} instanceLog
 * @return {[type]}
 */
function log(instanceLog) {
  return function (level = 'info', msg = '', data = {}) {
    if (level instanceof Error) {
      msg = level;
      level = 'error';
    }

    if (!level || !msg) {
      instanceLog.error(new Error('level or msg arguments required'));
    }

    instanceLog.level = level; // Make sure level is set each time
    instanceLog[level](data, msg);
  };
}

module.exports.init = init;
module.exports.meta = meta;
module.exports.log = log;
