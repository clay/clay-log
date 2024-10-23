'use strict';

const isNode = typeof process !== 'undefined'
  && process.versions != null
  && process.versions.node != null;

var pino = require('pino'), // Can be overwritten for testing
  logger, // Will be overwritten during setup
  plugins;

/**
 * allow passing in a different output to stream to
 * note: this is used by tools that want to output logs to stderr rather than stdout
 * @param  {Object} args
 * @return {stream}
 */
function getOutput(args) {
  return args.output || process.stdout;
}

/**
 * determine whether to pretty-print logs
 * @param  {Object} args
 * @return {Boolean}
 */
function getPrettyPrint(args) {
  if (!process.versions || !process.versions.node) {
    return false; // No pretty logging on the client-side.
  } else if (args.pretty === true || args.pretty === false) {
    return args.pretty;
  } else if (process.env.CLAY_LOG_PRETTY) {
    return process.env.CLAY_LOG_PRETTY !== 'false';
  } else {
    return false;
  }
}

/**
 * check args to make sure they exist and have a `name` property
 * @param  {object} args
 */
function checkArgs(args) {
  if (!args || !Object.keys(args).length || !args.name) {
    throw new Error('Init must be called with `name` property');
  }
}

/**
 * Returns the absolute path to an additional directory containing clay-log plugins.
 *
 * @param  {string} dirname: The absolute or relative directory name.
 * @returns {?string} A string containing an FS path or null.
 */
function resolvePluginPath(dirname) {
  if (!dirname) {
    return null;
  }

  const path = require('path');
  const absPath = path.isAbsolute(dirname)
    ? dirname
    : path.join(process.cwd(), dirname);

  // This will normalize the path to ensure it never includes trailing slashes.
  return absPath.replace(/\/+$/, '');
}

/**
 * Initialize the logger.
 *
 * @param  {Object} args
 * @param  {string} args.name
 * @param  {boolean} args.omitHost
 * @param  {object} args.meta
 * @return {Function}
 */
function init(args) {
  let output, stream, pretty, name, meta, omitHost;

  checkArgs(args);

  output = getOutput(args);
  stream = getOutput(args);
  pretty = getPrettyPrint(args);
  name = args.name;
  omitHost = args.omitHost || false;
  meta = args.meta || undefined;

  if (pretty) {
    output = pino.pretty({ levelFirst: true });
    output.pipe(stream);
  }

  // Set the logger. The minimum allowed
  // level is set via an env var called `LOG`
  logger = pino({
    name: name,
    base: omitHost ? { pid: process.pid } : undefined,
    level: process.env.LOG || 'info'
  }, output);

  // If meta data was passed in for all logging, let's add it
  if (meta && Object.keys(meta).length) {
    logger = logger.child(meta);
  }

  return log(logger);
}

/**
 * Initialize logger plugins.
 * Accepts a comma-delimited list of logging plugins to load and
 * composes them together to return a single function applying all plugins.
 *
 * @return {function}
 */
function initPlugins() {
  const CLAY_LOG_PLUGINS = process.env.CLAY_LOG_PLUGINS || '';
  const CLAY_LOG_PLUGINS_PATH = resolvePluginPath(process.env.CLAY_LOG_PLUGINS_PATH);
  const PATHS = [CLAY_LOG_PLUGINS_PATH, './plugins'].filter(x => !!x);

  const modules = CLAY_LOG_PLUGINS
    .split(',')
    .map(module => module.trim())
    .filter(module => !!module)
    .filter(module => module[0] != '_') // "_" is used to reserve the private namespace.
    .map((module) => {
      for (let i = 0; i < PATHS.length; ++i) {
        try {
          return require(`${PATHS[i]}/${module}`);
        } catch (err) {
          logger.error(`Could not locate clay-log plugin ${module}.`);
        }
      }
    })
    .filter(module => !!module);

  if (modules.length == 0) {
    return (x) => x;
  } else if (modules.length == 1) {
    return modules[0];
  } else {
    return modules.reduce((a, b) => (...args) => b(a(...args)));
  }
}

/**
 * Return a new logging instance with associated metadata
 * on each log line
 *
 * @param  {Object} options
 * @param  {Object} logInstance
 * @return {Function}
 */
function meta(options, logInstance) {
  var fork = logInstance || logger;

  if (options && Object.keys(options).length) {
    return log(fork.child(options));
  }

  throw new Error('Clay Log: `meta` function requires object argument');
}

/**
 * Return an instance of a logger which is ready to be
 * used. Errors get logged as errors, otherwise you need to
 * call the appropriate level
 *
 * i.e. log('info', 'some message', { otherData: 1});
 *
 * @param  {Object} instanceLog
 * @return {Function}
 */
function log(instanceLog) {
  if (isNode && !plugins) {
    instanceLog = initPlugins()(instanceLog);
  }

  return function (level, msg, data) {
    data = data || {};

    if (level instanceof Error) {
      msg = level;
      level = 'error';
    }

    if (!level || !msg) {
      instanceLog.error(new Error('level or msg arguments required'));
      return;
    }

    // Assign the _label
    data._label = level.toUpperCase();

    // Log it
    instanceLog[level](data, msg);
  };
}

/**
 * Overwrites Pino package with stub for testing
 *
 * @param {Object} overwrite
 */
function setLogger(overwrite) {
  pino = overwrite;
}

/**
 * Returns the in-memorey logging instance
 * @return {Object}
 */
function getLogger() {
  return logger;
}

module.exports.init = init;
module.exports.meta = meta;
module.exports.getLogger = getLogger;

// For testing
module.exports.log = log;
module.exports.setLogger = setLogger;
module.exports.resolvePluginPath = resolvePluginPath;
