'use strict';

const sinon = require('sinon'),
  devnull = require('dev-null'),
  fs = require('fs'),
  path = require('path'),
  dirname = __dirname.split('/').pop(),
  lib = require('./'),
  expect = require('chai').expect,
  { noop } = require('pino/lib/tools'),
  semver = require('semver'),
  { Writable } = require('stream'),
  vm = require('vm');

describe(dirname, function () {
  const levels = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
  };
  let sandbox, fakeLog, pipeSpy, childSpy;

  function createFakeLogger() {
    const logger = { child: childSpy, levels: { values: levels } };

    Object.keys(levels).forEach((level) => {
      switch (level) {
        case 'trace':
          logger[level] = noop;
        case 'debug':
          logger[level] = noop;
        default:
          logger[level] = sinon.stub();
      }
    });

    const fakeLog = sandbox.stub().returns(logger);

    fakeLog.pretty = sandbox.stub().returns({
      pipe: pipeSpy
    });

    return fakeLog;
  }

  beforeEach(function () {
    process.env.NODE_ENV = 'test';
    process.env.CLAY_LOG_PLUGINS = '';
    sandbox = sinon.sandbox.create();
    pipeSpy = sandbox.spy();
    childSpy = sandbox.spy();
    fakeLog = createFakeLogger();
    lib.setLogger(fakeLog);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('init', function () {
    const fn = lib[this.title];

    it('throws an error if not instantiated with no arguments', function () {
      expect(fn).to.throw(Error);
    });

    it('throws an error if not with an empty object', function () {
      var cb = () => fn({});

      expect(cb).to.throw(Error);
    });

    it('throws an error if arg object does not contain a `name` property', function () {
      var cb = () => fn({ name: 'test' });

      expect(cb).to.not.throw(Error);
    });

    it('calls pino.pretty function if `CLAY_LOG_PRETTY` is set to "true"', function () {
      process.env.CLAY_LOG_PRETTY = 'true';
      fn({ name: 'test' });
      sinon.assert.calledOnce(fakeLog.pretty);
      sinon.assert.calledOnce(pipeSpy);
      delete process.env.CLAY_LOG_PRETTY;
    });

    it('doesn\'t call pino.pretty function if `CLAY_LOG_PRETTY` is set to "false"', function () {
      process.env.CLAY_LOG_PRETTY = 'false';
      fn({ name: 'test'});
      sinon.assert.notCalled(fakeLog.pretty);
      delete process.env.CLAY_LOG_PRETTY;
    });

    it('doesn\'t call pino.pretty function if `CLAY_LOG_PRETTY` is not set', function () {
      delete process.env.CLAY_LOG_PRETTY;
      fn({ name: 'test'});
      sinon.assert.notCalled(fakeLog.pretty);
    });

    it('calls pino.pretty function if `pretty` is passed into init', function () {
      fn({ name: 'test', pretty: true });
      sinon.assert.calledOnce(fakeLog.pretty);
      sinon.assert.calledOnce(pipeSpy);
    });

    it('doesn\'t call pino.pretty function if `pretty` is false and CLAY_LOG_PRETTY is "true"', function () {
      process.env.CLAY_LOG_PRETTY = 'true';
      fn({ name: 'test', pretty: false });
      sinon.assert.notCalled(fakeLog.pretty);
      delete process.env.CLAY_LOG_PRETTY;
    });

    it('calls pino.child function if `meta` object is passed in', function () {
      var fakeMeta = { fake: 'meta' };

      fn({ name: 'test', meta: fakeMeta });
      sinon.assert.calledWith(childSpy, fakeMeta);
      sinon.assert.calledOnce(childSpy);
    });

    it('returns a function', function () {
      expect(fn({ name: 'test'})).is.instanceof(Function);
    });
  });

  describe('meta', function () {
    const fn = lib[this.title];

    it('throws an error if no arg is passed in', function () {
      expect(fn).to.throw();
    });

    it('calls the logger `child` function to spawn a new logger instance', function () {
      var fakeMeta = { fake: 'meta' };

      fn(fakeMeta, fakeLog());
      sinon.assert.calledWith(childSpy, fakeMeta);
    });
  });

  describe('log', function () {
    const fn = lib[this.title];

    it('returns a function', function () {
      expect(fn()).is.instanceof(Function);
    });

    it('calls the level of logging passed in', function () {
      var fakeLogInstance = {
          info: sinon.stub()
        },
        log = fn(fakeLogInstance);

      log('info', 'message');
      sinon.assert.calledOnce(fakeLogInstance.info);
      sinon.assert.calledWith(fakeLogInstance.info, {_label: 'INFO'}, 'message');
    });

    it('calls the logging level with the arg object', function () {
      var fakeLogInstance = {
          info: sinon.stub()
        },
        log = fn(fakeLogInstance),
        data = { some: 'data' };

      log('info', 'message', data);
      sinon.assert.calledOnce(fakeLogInstance.info);
      sinon.assert.calledWith(fakeLogInstance.info, data, 'message');
    });


    it('calls the `error` logging if an error is passed in', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log(fakeError);
      sinon.assert.calledOnce(fakeLogInstance.error);
      sinon.assert.calledWith(fakeLogInstance.error, {_label: 'ERROR', error: fakeError}, fakeError);
    });

    it('puts an Error passed as the message in the data under `error`, next to the rest of the data', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log('error', fakeError, { uri: 'a/b' });
      sinon.assert.calledWith(fakeLogInstance.error, {_label: 'ERROR', uri: 'a/b', error: fakeError}, fakeError);
    });

    it('does not change the data object when it adds the Error', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        data = { uri: 'a/b' };

      log('error', new Error('issue!'), data);
      expect(data).to.deep.equal({ uri: 'a/b' });
    });

    it('does not carry an Error over to the next call that reuses the data object', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        data = {},
        first = new Error('first'),
        second = new Error('second');

      log('error', first, data);
      log('error', second, data);
      expect(fakeLogInstance.error.firstCall.args[0].error).to.equal(first);
      expect(fakeLogInstance.error.secondCall.args[0].error).to.equal(second);
    });

    it('leaves an Error that is passed as `data.error` alone', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log('error', 'message', { error: fakeError });
      sinon.assert.calledWith(fakeLogInstance.error, {_label: 'ERROR', error: fakeError}, 'message');
    });

    it('does not replace a `data.error` that is already there', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log('error', fakeError, { error: 'already described' });
      sinon.assert.calledWith(fakeLogInstance.error, {_label: 'ERROR', error: 'already described'}, fakeError);
    });

    it('treats an Error from another realm as an error', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance),
        foreignError = vm.runInNewContext('new TypeError("other realm")');

      expect(foreignError instanceof Error).to.equal(false);
      log(foreignError);
      sinon.assert.calledWith(fakeLogInstance.error, {_label: 'ERROR', error: foreignError}, foreignError);
    });

    it('logs an error if no level or msg are passed in', function () {
      var fakeLogInstance = {
          error: sinon.stub()
        },
        log = fn(fakeLogInstance);

      log();
      sinon.assert.calledOnce(fakeLogInstance.error);
    });

    it('logs memory usage if CLAY_LOG_PLUGINS is set to "heap"', function () {
      process.env.CLAY_LOG_PLUGINS = 'heap';
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        data = { some: 'data' },
        expected = {
          _label: 'INFO',
          does_zap_garbage: sinon.match.number,
          heap_size_limit: sinon.match.number,
          malloced_memory: sinon.match.number,
          peak_malloced_memory: sinon.match.number,
          total_available_size: sinon.match.number,
          total_heap_size: sinon.match.number,
          total_heap_size_executable: sinon.match.number,
          total_physical_size: sinon.match.number,
          used_heap_size: sinon.match.number,
          some: 'data'
        };

      // Node 12+ includes some additional context.
      if (semver.gte(process.version, '12.0.0')) {
        expected.number_of_detached_contexts = sinon.match.number;
        expected.number_of_native_contexts = sinon.match.number;
      }
      log('info', 'message', data);
      sinon.assert.calledOnce(fakeLogInstance.info._original);
      sinon.assert.calledWith(fakeLogInstance.info._original, expected, 'message');
    });

    it('doesn\'t log memory usage if CLAY_LOG_PLUGINS does not contain "heap"', function () {
      process.env.CLAY_LOG_PLUGINS = '';
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        data = { some: 'data' };

      log('info', 'message', data);
      sinon.assert.calledOnce(fakeLogInstance.info);
      sinon.assert.neverCalledWith(
        fakeLogInstance.info,
        { used_heap_size: sinon.match.any },
        'message'
      );
    });

    it('logs errors to Sentry if CLAY_LOG_PLUGINS is set to "sentry"', function () {
      process.env.CLAY_LOG_PLUGINS = 'sentry';
      const Sentry = require('@sentry/node');

      Sentry.captureException = sinon.stub();
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        data = { some: 'data' },
        expected = {
          _label: 'ERROR',
          some: 'data'
        };

      log('error', 'message', data);
      sinon.assert.calledOnce(fakeLogInstance.error._original);
      sinon.assert.calledWith(fakeLogInstance.error._original, expected, 'message');
      sinon.assert.calledOnce(Sentry.captureException);
      sinon.assert.calledWith(Sentry.captureException, sinon.match.has('stack'), sinon.match.object);
    });

    it('reports an Error message to Sentry as the exception, without repeating it in the extra data', function () {
      process.env.CLAY_LOG_PLUGINS = 'sentry';
      const Sentry = require('@sentry/node');

      Sentry.captureException = sinon.stub();
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log('error', fakeError, { some: 'data' });
      sinon.assert.calledOnce(Sentry.captureException);
      sinon.assert.calledWith(Sentry.captureException, fakeError, { extra: { _label: 'ERROR', some: 'data' } });
    });

    it('reports `data.error` to Sentry as the exception, and keeps the log message', function () {
      process.env.CLAY_LOG_PLUGINS = 'sentry';
      const Sentry = require('@sentry/node');

      Sentry.captureException = sinon.stub();
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log('error', 'could not do the thing', { error: fakeError, some: 'data' });
      sinon.assert.calledOnce(Sentry.captureException);
      sinon.assert.calledWith(Sentry.captureException, fakeError, {
        extra: { msg: 'could not do the thing', _label: 'ERROR', some: 'data' }
      });
    });

    it('keeps the log message in the extra data when the data has a `msg` of its own', function () {
      process.env.CLAY_LOG_PLUGINS = 'sentry';
      const Sentry = require('@sentry/node');

      Sentry.captureException = sinon.stub();
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        fakeError = new Error('issue!');

      log('error', 'could not do the thing', { error: fakeError, msg: 'something else' });
      sinon.assert.calledWith(Sentry.captureException, fakeError, {
        extra: { msg: 'could not do the thing', _label: 'ERROR' }
      });
    });

    it('reports an Error from another realm to Sentry as it is, as the message or as `data.error`', function () {
      process.env.CLAY_LOG_PLUGINS = 'sentry';
      const Sentry = require('@sentry/node');

      Sentry.captureException = sinon.stub();
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        asMessage = vm.runInNewContext('new TypeError("as the message")'),
        asData = vm.runInNewContext('new TypeError("as data.error")');

      log('error', asMessage, { some: 'data' });
      log('error', 'could not do the thing', { error: asData });
      sinon.assert.calledTwice(Sentry.captureException);
      sinon.assert.calledWith(Sentry.captureException.firstCall, asMessage, { extra: { _label: 'ERROR', some: 'data' } });
      sinon.assert.calledWith(Sentry.captureException.secondCall, asData, {
        extra: { msg: 'could not do the thing', _label: 'ERROR' }
      });
    });

    it('runs multiple plugins CLAY_LOG_PLUGINS is set to "sentry,heap"', function () {
      process.env.CLAY_LOG_PLUGINS = 'sentry,heap';
      const Sentry = require('@sentry/node');

      Sentry.captureException = sinon.stub();

      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        data = { some: 'data' };

      log('error', 'message', data);
      sinon.assert.calledOnce(fakeLogInstance.error._original._original);
      sinon.assert.calledWith(
        fakeLogInstance.error._original._original,
        sinon.match.has('used_heap_size'), 'message'
      );
      sinon.assert.calledOnce(Sentry.captureException);
    });

    it('skips unavailable or invalid CLAY_LOG_PLUGINS', function () {
      process.env.CLAY_LOG_PLUGINS = 'foo,bar,baz';
      const fakeLogInstance = createFakeLogger()(),
        log = fn(fakeLogInstance),
        data = { some: 'data' },
        expected = {
          _label: 'INFO',
          some: 'data'
        };

      log('info', 'message', data);
      sinon.assert.calledOnce(fakeLogInstance.info);
      sinon.assert.calledWith(fakeLogInstance.info, expected, 'message');
    });

    it('loads custom plugins with CLAY_LOG_PLUGINS_PATH', function (done) {
      process.env.CLAY_LOG_PLUGINS = 'memory';

      fs.mkdtemp(path.join('.', '.clay-log-test-'), (err, dirname) => {
        if (err) throw err;
        process.env.CLAY_LOG_PLUGINS_PATH = dirname;
        fs.copyFileSync('./plugins/heap.js', path.join(dirname, 'memory.js'));
        fs.copyFileSync('./plugins/_utils.js', path.join(dirname, '_utils.js'));
        const fakeLogInstance = createFakeLogger()(),
          log = fn(fakeLogInstance),
          data = { some: 'data' };

        log('info', 'message', data);
        sinon.assert.calledOnce(fakeLogInstance.info._original);
        sinon.assert.calledWithMatch(fakeLogInstance.info._original, { used_heap_size: sinon.match.any });
        fs.unlinkSync(path.join(dirname, 'memory.js'));
        fs.unlinkSync(path.join(dirname, '_utils.js'));
        fs.rmdirSync(dirname, { recursive: true });
        done();
      });
    });
  });

  describe('serializeError', function () {
    const fn = lib[this.title];

    it('describes the kind, message and stack of an Error', function () {
      const err = new TypeError('issue!'),
        described = fn(err);

      expect(described.kind).to.equal('TypeError');
      expect(described.message).to.equal('issue!');
      expect(described.stack).to.equal(err.stack);
      expect(described).to.not.have.property('cause');
      expect(described).to.not.have.property('code');
    });

    it('uses the class name for a subclass that does not set its own name', function () {
      class NotFoundError extends Error {}

      expect(fn(new NotFoundError('issue!')).kind).to.equal('NotFoundError');
    });

    it('uses the name an Error sets for itself', function () {
      const err = new Error('issue!');

      err.name = 'CustomError';
      expect(fn(err).kind).to.equal('CustomError');
    });

    it('includes the code, and the system and HTTP fields an Error has', function () {
      const err = new Error('issue!');

      err.code = 'ENOENT';
      err.errno = -2;
      err.syscall = 'open';
      err.path = 'public/media/podcast.svg';
      err.status = 404;
      err.statusCode = 404;

      expect(fn(err)).to.include({
        code: 'ENOENT',
        errno: -2,
        syscall: 'open',
        path: 'public/media/podcast.svg',
        status: 404,
        statusCode: 404
      });
    });

    it('leaves out other properties, and fields that are not a string, number or boolean', function () {
      const err = new Error('issue!');

      err.config = { headers: { Authorization: 'Bearer secret' } };
      err.response = '{"a long": "response body"}';
      err.status = { not: 'a number' };
      err.path = ['not', 'a', 'string'];
      const described = fn(err);

      expect(Object.keys(described).sort()).to.deep.equal(['kind', 'message', 'stack']);
    });

    it('describes the chain of causes', function () {
      const root = new RangeError('root'),
        middle = new Error('middle'),
        top = new Error('top');

      middle.cause = root;
      top.cause = middle;
      const described = fn(top);

      expect(described.cause.message).to.equal('middle');
      expect(described.cause.cause.kind).to.equal('RangeError');
      expect(described.cause.cause.message).to.equal('root');
      expect(described.cause.cause).to.not.have.property('cause');
    });

    it('follows five causes at most', function () {
      let err = new Error('0'),
        described,
        depth = 0;

      for (let i = 1; i < 9; i++) {
        const next = new Error(String(i));

        next.cause = err;
        err = next;
      }

      described = fn(err);
      while (described.cause) {
        depth++;
        described = described.cause;
      }

      expect(depth).to.equal(5);
    });

    it('stops when causes point back at each other', function () {
      const a = new Error('a'),
        b = new Error('b');

      a.cause = b;
      b.cause = a;
      const described = fn(a);

      expect(described.cause.message).to.equal('b');
      expect(described.cause).to.not.have.property('cause');
    });

    it('leaves out a cause that is not an Error', function () {
      const err = new Error('issue!');

      err.cause = 'because';
      expect(fn(err)).to.not.have.property('cause');
    });

    it('describes an Error from another realm', function () {
      const described = fn(vm.runInNewContext('new TypeError("other realm")'));

      expect(described.kind).to.equal('TypeError');
      expect(described.message).to.equal('other realm');
    });
  });

  describe('the log line', function () {
    let lines, log;

    beforeEach(function () {
      lines = [];
      lib.setLogger(require('pino'));
      log = lib.init({
        name: 'test',
        output: new Writable({
          write(chunk, encoding, done) {
            lines.push(JSON.parse(chunk.toString()));
            done();
          }
        })
      });
    });

    it('describes an Error passed as the message', function () {
      const cause = new Error('db down'),
        err = new TypeError('compose failed');

      cause.code = 'ECONNREFUSED';
      err.cause = cause;
      log('error', err, { uri: 'a/b' });

      expect(lines).to.have.length(1);
      expect(lines[0].msg).to.equal('TypeError: compose failed');
      expect(lines[0].uri).to.equal('a/b');
      expect(lines[0].error.kind).to.equal('TypeError');
      expect(lines[0].error.message).to.equal('compose failed');
      expect(lines[0].error.stack).to.equal(err.stack);
      expect(lines[0].error.cause.message).to.equal('db down');
      expect(lines[0].error.cause.code).to.equal('ECONNREFUSED');
    });

    it('keeps what a Node system error says about the file, like it did before', function () {
      let err;

      try {
        fs.readFileSync(path.join(__dirname, 'does-not-exist.svg'));
      } catch (e) {
        err = e;
      }
      log('error', 'Failure to read the file.', { error: err });

      expect(lines[0].msg).to.equal('Failure to read the file.');
      expect(lines[0].error.kind).to.equal('Error');
      expect(lines[0].error.message).to.contain('ENOENT');
      expect(lines[0].error.code).to.equal('ENOENT');
      expect(lines[0].error.errno).to.equal(err.errno);
      expect(lines[0].error.syscall).to.equal('open');
      expect(lines[0].error.path).to.equal(err.path);
    });

    it('describes an Error passed on its own', function () {
      log(new Error('issue!'));

      expect(lines[0].level).to.equal(50);
      expect(lines[0].error.message).to.equal('issue!');
    });

    it('describes an Error passed as `data.error`, next to its own message', function () {
      log('error', 'could not compose the page', { error: new Error('db down') });

      expect(lines[0].msg).to.equal('could not compose the page');
      expect(lines[0].error.message).to.equal('db down');
      expect(lines[0].error.stack).to.contain('db down');
    });

    it('leaves an `error` that is not an Error as it was logged', function () {
      log('error', 'message', { error: 'a string' });
      log('error', 'message', { error: { some: 'data' } });

      expect(lines[0].error).to.equal('a string');
      expect(lines[1].error).to.deep.equal({ some: 'data' });
    });
  });

  describe('getLogger', function () {
    const fn = lib[this.title];

    it('returns the logger', function () {
      var fakeLogger = sandbox.stub().returns('hello');

      lib.setLogger(fakeLogger);
      lib.init({name: 'testing'});
      expect(fn()).to.equal('hello');
    });
  });

  describe('wrap', function () {
    const fn = require('./plugins/_utils')[this.title];
    const pino = require('pino');
    const logger = pino({ name: 'test-wrapper', level: 'warn' }, devnull());
    const fakeService = sinon.stub();

    function fakePlugin() {
      fakeService('foo');
    }

    const wrappedLogger = fn(fakePlugin, ['info', 'warn'])(logger);

    it('does not trigger plugin due to pino log level being set higher than "info"', function () {
      wrappedLogger.info('test log: ignore this message');
      sinon.assert.notCalled(fakeService);
    });

    it('does not trigger plugin due to plugin config excluding "error"', function () {
      wrappedLogger.error('test log: ignore this message');
      sinon.assert.notCalled(fakeService);
    });

    it('trigers the plugin due to pino log level and plugin including "warn"', function () {
      wrappedLogger.warn('test log: ignore this message');
      sinon.assert.calledOnce(fakeService);
    });
  });

  describe('resolvePluginPath', function () {
    const fn = lib[this.title];

    it('resolves an absolute path', function () {
      expect(fn('/tmp/foo')).to.equal('/tmp/foo');
    });

    it('resolves a relative path', function () {
      expect(fn('./tmp/foo')).to.equal(`${process.cwd()}/tmp/foo`);
    });

    it('returns null for an empty string', function () {
      expect(fn('')).to.equal(null);
    });

    it('returns null for an undefined value', function () {
      expect(fn(undefined)).to.equal(null);
    });
  });
});
