'use strict';

const v8 = require('v8');

const { wrap } = require('./_utils');

/**
 * Adds memory-use data from v8.getHeapStatistics to a log's context
 *
 * @param {object} data: The data to enhance.
 * @param {string} msg: The string summary of the log line.
 */
function wrapper(data, msg) {
  data = Object.assign(data, v8.getHeapStatistics());
}

module.exports = wrap(wrapper);
