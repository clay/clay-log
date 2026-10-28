'use strict';

/**
 * Whether a value is an Error, including one created in another realm
 * (an iframe or vm context), where `instanceof Error` is false.
 *
 * @param  {*} value
 * @return {Boolean}
 */
module.exports = function isError(value) {
  return value instanceof Error || Object.prototype.toString.call(value) === '[object Error]';
};
