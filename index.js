'use strict'

const pino = require('pino'),
  pkg = require('./package.json');

var logger;

/**
 * [init description]
 * @param  {String} [name='' }]            [description]
 * @return {[type]}          [description]
 */
function init({ name = '', prettyPrint = false }) {
  let output = process.stdout;

  if (prettyPrint) {
    output = pino.pretty({
      levelFirst: true
    });
    output.pipe(process.stdout);
  }

  logger = pino({
    name
  }, output);

  return log();
}

/**
 * [meta description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function meta(options) {
  return log(logger.child(options));
}

/**
 * Call the proper log level
 * @param  {[type]} level     [description]
 * @param  {[type]} msg       [description]
 * @param  {Object} [data={}] [description]
 * @return {[type]}           [description]
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
  }
}

module.exports.init = init;
module.exports.meta = meta;
module.exports.log = log;
