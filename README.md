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

## Pretty Printing

If you don't pass in a `pretty` property, pretty printing will controlled by the `CLAY_LOG_PRETTY` environment variable. The logs will be printed in human readable form. Otherwise they will be regular PinoJS JSON strings.
