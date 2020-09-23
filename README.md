# Clay Log
> An ismorphic logging module for Clay projects built around [PinoJS](https://github.com/pinojs/pino)

## Why use Clay Log?

The purpose of this logging module is to wrap the instantiation of Pino for your Clay projects so that it can be used in multiple environments and output logs for the both local debugging (pretty printing) and log aggregators (such as the [ELK stack](https://www.elastic.co/products)). Use cases include:

- Server-side
  - Amphora
  - Amphora Renderers (Amphora HTML)
  - Amphora plugins (Amphora Search)
  - Clay-related microservicestog
  - `model.js` files
- Client-side
  - Kiln
  - Kiln plugins (Clay Space Edit)
  - `model.js` files

## Setup

Instantiate the `clay-log` module.

```
const clayLog = require('clay-log');

var log = clayLog.init({
  name: 'amphora'
});

logger('info', 'some cool message', { additional: 'info' });
```

Want to attach some piece of data to every log? Use the `meta` property. It accepts an Object, like so:

```
var log = clayLog.init({
  name: 'amphora',
  meta: {
    important: 'information'
  }
});
```

Maybe you're wanting to get a new instance of a logger with its own associated metadata? Use the `meta` method. It accepts an Object as an argument and will spawn a new logger.

```
var loggerOne = clayLog.init({
  name: 'amphora',
  meta: {
    important: 'information'
  }
});

var loggerTwo = clayLog.meta({ another: 'piece of info' });

loggerOne('info', 'some cool message', { additional: 'info' });
loggerTwo('info', 'some different cool message');
```

If you'd like human-readable logs, Use the `pretty` property.

```
var loggerOne = clayLog.init({
  name: 'some-cli-tool',
  pretty: true
});
```

If you're using the module in a command-line tool, it's useful to be able to specify where the logs should output to. By default, they will output to `stdout`, but this can be changed by the `output` property.

```
var loggerOne = clayLog.init({
  name: 'some-cli-tool',
  output: process.stderr
});
```

## Usage

Once you have a logging instance you're free to begin logging. Logging levels are the same as the default PinoJS levels:

  - `info`
  - `trace`
  - `debug`
  - `warn`
  - `error`

To use simply do the following:

```
var loggingInstance = clayLog.init({
  name: 'coolClayProject',
  meta: {
    important: 'information'
  }
});

loggingInstance('info', 'my cool message!', { additional: 'info' });

```

The arguments are in the following order:
1. Logging level
2. Message (String)
3. Accompanying log information (Object)

### Setting Minimum Log Level

For production instances it may not be necessary to log the same messages you do in dev environments. By default, Clay Log will only display `info` and above level logs, but this can be configured with an environment variable. Set `process.env.LOG` to a [corresponding log level](#usage) and that will be the minimum level that appears.

### Errors

Want to be lazy? If you pass in an `Error` object as the only argument and everything will get formatted properly OR just pass an `Error` as a second argument and you'll be good.

```
var loggingInstance = clayLog.init({
  name: 'coolClayProject',
  meta: {
    important: 'information'
  }
});

loggingInstance(new Error('oh no!'));
loggingInstance('error', new Error('oh no!'));
```

## `_label` Property

This property on the output log message is meant to make the logs more human searchable when using grep or importing into an ELK-like tool. Rather than making people remember the association between `level` and the different levels meanings, we supply a human-readable property.

## Environment Variables

| **Config Value**        | **Decription**                                     |
| ----------------------- | -------------------------------------------------- |
| `CLAY_LOG_HEAP`         | Set to '1' to enable heap logging.                 |
| `CLAY_LOG_PRETTY`       | Set to a 'truthy' value to enable pretty-printing. |
| `CLAY_LOG_PLUGINS`      | Comma-delimited list of plug-ins to enabled. Plug-ins are applied in the order listed. |
| `CLAY_LOG_PLUGINS_PATH` | Absolute path (or path relative to the CWD) for directory containing additional plug-ins. |


#### Heap Logging

If `CLAY_LOG_PLUGINS` includes "heap" the following additional heap statistics will
be included:
```json
{
    "does_zap_garbage": 0,
    "heap_size_limit": 0,
    "malloced_memory": 0,
    "number_of_detatched_contexts": 0,
    "number_of_native_contexts": 0,
    "peak_malloced_memory": 0,
    "total_available_size": 0,
    "total_heap_size": 0,
    "total_heap_size_executable": 0,
    "total_physical_size": 0,
    "used_heap_size": 0
}
```

#### Sentry Reporting

If `CLAY_LOG_PLUGINS` includes "sentry" all `error` level logs will be reported to Sentry.

:warning: This plug-in requires `@sentry/node` to be installed as a peer dependency and `SENTRY_DSN` to be set as an environment variable.

#### Pretty Printing

If you don't pass in a `pretty` property, pretty printing will controlled by the `CLAY_LOG_PRETTY` environment variable. The logs will be printed in human readable form. Otherwise they will be regular PinoJS JSON strings.


## Writing Core Plug-Ins

A plug-in is a wrapper function that accepts two arguments:

* `data`: The extra context object that will be included in a log.
* `msg`: The string summary of the log message.

A plug-in can be used to enhance `data` with additional context or to take additional
actions (like reporting errors to another service).

Here is an example plug-in called `env` that will add the `NODE_ENV` to every log line with
the `warn` or `error` level:

```js
# ./plugins/env.js

// This utility should be used in all plug-ins. It provides an abstraction
// around the process used to wrap functions.
const { wrap } = require('./_utils');

// This is where your plug-in code will be defined. Anything in this block is
// executed **before** clay-log logs the message.
function wrapper(data, msg) {
    data.env = process.env.NODE_ENV;
}

// The export of a plug-in will always use the format `wrap(<plug-in-func>, [<levels>])`.
// Omitting `[<levels>]` will apply the plug-in to all active log-levels.
module.exports = wrap(wrapper, ['warn', 'error']);
```

## Writing Custom Plug-Ins

A "custom" plug-in is a clay-log extension that lives outside of the `clay-log` project.
Use a custom plug-in when extending or modifying log data with needs that are specific
to your use-case but not useful for a broader audience.

To write a custom plugin:

1. Designate where you will store your plug-ins in your project, eg. `./utils/clay-log-plugins`.
2. Set the `CLAY_LOG_PLUGINS_PATH` environment variable to `./utils/clay-log-plugins`.
3. Write your plug-in code.

```js
# ./utils/clay-log-plugins/rename.js

// The utility wrapper import path changes a bit when developing a custom plug-in.
const { wrap } = require('clay-log/plugins/_utils');

// This is where your plug-in code will be defined. Anything in this block is
// executed **before** clay-log logs the message.
function wrapper(data, msg) {
    data.message = data.msg;
    delete data['msg'];
}

// The export of a plug-in will always use the format `wrap(<plug-in-func>, [<levels>])`.
// Omitting `[<levels>]` will apply the plug-in to all active log-levels.
module.exports = wrap(wrapper, ['warn', 'error']);
```

4. Set `CLAY_LOG_PLUGINS=rename` (or whatever custom plug-in names you've used).
