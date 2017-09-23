# Clay Log

[![Greenkeeper badge](https://badges.greenkeeper.io/clay/clay-log.svg)](https://greenkeeper.io/)
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

## Pretty Printing

Pretty printing is controlled by an environment variable. By setting `process.env.CLAY_LOG_PRETTY` the logs will be printed in human readable form. Otherwise they will be regular PinoJS JSON strings.
