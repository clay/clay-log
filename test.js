'use strict';

const sinon = require('sinon'),
  devnull = require('dev-null'),
  fs = require('fs'),
  path = require('path'),
  dirname = __dirname.split('/').pop(),
  lib = require('./'),
  expect = require('chai').expect,
  { noop } = require('pino/lib/tools'),
  semver = require('semver');

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
      sinon.assert.calledWith(fakeLogInstance.error, {_label: 'ERROR'}, fakeError);
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
