# Clay Log
> An ismorphic logging module for Clay projects built around [PinoJS](https://github.com/pinojs/pino)

## Why use Clay Log?

The purpose of this logging module is to wrap the instantiation of Pino for your Clay projects so that it can be used in multiple environments and output logs for the both local debugging (pretty printing) and log aggregators (such as the [ELK stack](https://www.elastic.co/products)). Use cases include:

- Server-side
  - Amphora
  - Amphora Renderers (Amphora HTML)
  - Amphora plugins (Amphora Search)
  - Clay-related microservices
  - `model.js` files
- Client-side
  - Kiln
  - Kiln plugins (Clay Space Edit)
  - `model.js` files

## API

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

Pretty printing is controlled by an environment variable. By setting `process.env.CLAY_LOG_PRETTY` the logs will be printed in human readable form. Otherwise they will be regular PinoJS JSON strings.
