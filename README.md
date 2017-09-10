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
EXAMPLE
```

Pretty printing is controlled by an environment variable
```
EXAMPLE PRETTY VS NON-PRETTY PRINTING
```

Attach metadata associated with each line. Handy for environment, version number, etc.

```
ADD META API
```

### API Design
- Env var specifies pretty printing vs normal printing for consumers
- Specify level as first string
- Second string defaults to the message that is pretty printed.
  - Only accepts one string
- Third arg is an object which will be added to the logging
- In production, stdout is piped to a transport. Transport is not part of repo/API
