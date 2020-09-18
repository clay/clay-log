'use strict';

const v8 = require('v8');

const { wrap } = require('./_utils');

function wrapper(data, msg) {
  data = Object.assign(data, v8.getHeapStatistics());
}

module.exports = wrap(wrapper);
