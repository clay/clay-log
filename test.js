'use strict';

/**
 * This could be an example service for logging. The user could write a service around
 * the `init` and `meta` methods for consistent logging across the whole application
 * and on a per-file basis.
 *
 * Furthermore, Pino has serializers that we can use to replicate the `SILLY` env var
 * for showing EVERYTHING being logged ('verbose').
 */
const lib = require('./');

lib.init({
  name: 'Testing',
  prettyPrint: true // <----- CHANG THIS TO FALSE TO SEE WHAT ELK WOULD TAKE IN
});

var log = lib.meta({
  cool: 'cool!'
}),
anotherlog = lib.meta({
  filename: __filename
});

log('info', 'womp womp', {work: 'plz'});
console.log('\n\n');
anotherlog('trace', 'wssfasdfasf', {asdf: 'dfdf'});
console.log('\n\n');
anotherlog('fatal', 'fatal error');
console.log('\n\n');
anotherlog('debug', 'debug log', { exampleElasticQuery: '{query: { term: { cool: "query"}}}'});
console.log('\n\n');
anotherlog(new Error('oh man this is an error'));
anotherlog('error', new Error('specifying error level'));
console.log('\n\n');
anotherlog('warn', 'something isn\'t groovy', { something: 'notGroovy' });
