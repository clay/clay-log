'use strict';

const sinon = require('sinon'),
  dirname = __dirname.split('/').pop(),
  lib = require('./'),
  expect = require('chai').expect;

describe(dirname, function () {
  let sandbox, fakeLog, pipeSpy, childSpy;

  function createFakeLogger() {
    var fakeLog = sandbox.stub().returns({
      child: childSpy
    });

    fakeLog.pretty = sandbox.stub().returns({
      pipe: pipeSpy
    });

    return fakeLog;
  }

  beforeEach(function () {
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

    it('calls pino.pretty function if `prettyPrint` is set to true', function () {
      process.env.CLAY_LOG_PRETTY = true;
      fn({ name: 'test', prettyPrint: true });
      sinon.assert.calledOnce(fakeLog.pretty);
      sinon.assert.calledOnce(pipeSpy);
      delete process.env.CLAY_LOG_PRETTY;
    });

    it('calls pino.pretty function if `pretty` is passed into init', function () {
      fn({ name: 'test', pretty: true });
      sinon.assert.calledOnce(fakeLog.pretty);
      sinon.assert.calledOnce(pipeSpy);
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
});
