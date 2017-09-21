// 'use strict';
//
// /**
//  * This could be an example service for logging. The user could write a service around
//  * the `init` and `meta` methods for consistent logging across the whole application
//  * and on a per-file basis.
//  *
//  * Furthermore, Pino has serializers that we can use to replicate the `SILLY` env var
//  * for showing EVERYTHING being logged ('verbose').
//  */
// const lib = require('./');
//
// var log = lib.init({
//   name: 'Testing',
//   prettyPrint: false // <----- CHANG THIS TO FALSE TO SEE WHAT ELK WOULD TAKE IN
//   // , meta: { sitesVersion: 1 }
// });
//
//
//
// log = lib.meta({
//   file: __filename,
//   sdfsdf: 'asfasdf'
// });
//
//
// // log('info', 'Some cool message', { fgsdfg: 'sdfgsdfgfsdg'});
// // log('trace', 'wssfasdfasf', {asdf: 'dfdf'});
// // log('fatal', 'fatal error');// console.log('\n\n');
// log('debug', 'debug log', { exampleElasticQuery: '{query: { term: { cool: "query"}}}'});// console.log('\n\n');
// // log(new Error('oh man this is an error'));
// // log('error', new Error('specifying error level'));// console.log('\n\n');
// // log('warn', 'something isn\'t groovy', { something: 'notGroovy' });

'use strict';

const sinon = require('sinon'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./'),
  expect = require('chai').expect;

describe(dirname, function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('default function', function () {
    it('fd', function () {
      expect(true).to.be.true;
    });
  });
});
