# Alliage Configuration Loader

A powerful module for loading and validating YAML configuration files in your Alliage applications.

## Dependencies

- [@alliage/lifecycle](../lifecycle)

## Installation

```bash
# Using yarn
yarn add @alliage/config-loader

# Using npm
npm install @alliage/config-loader
```

## Registration

If you've already installed [@alliage/module-installer](../module-installer), simply run:

```bash
$(npm bin)/alliage-scripts install @alliage/config-loader
```

Otherwise, update your `alliage-modules.json` file by adding this to the bottom:

```json
{
  // ... other modules
  "@alliage/config-loader": {
    "module": "@alliage/config-loader",
    "deps": [
      "@alliage/lifecycle"
    ],
    "envs": []
  }
}
```

## Usage Guide

### Creating a Configuration File

First, create a YAML configuration file in the `config` folder of your project. The file name can be anything you prefer, but it must have a `.yaml` extension.

Example configuration file:

```yaml
# config/webserver.yaml
host: 127.0.0.1
port: 8080
credentials:
  username: johndoe
  password: '411!463|20(|(5'
```

### Loading the Configuration File

To load your configuration file, listen to the `CONFIG_EVENTS.LOAD` event and use the `loadConfig` helper function.

#### JavaScript Example

```javascript
// MyModule.js
import { AbstractLifeCycleAwareModule } from '@alliage/lifecycle';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

// Define your JSON schema for validation
const schema = {
  type: 'object',
  required: ['host', 'port', 'credentials'],
  properties: {
    host: { type: 'string' },
    port: { type: 'number' },
    credentials: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' }
      }
    }
  }
};

export class MyModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig('webserver', validators.jsonSchema(schema))
    };
  }
}

export default MyModule;
```

#### TypeScript Example

```typescript
// MyModule.ts
import { AbstractLifeCycleAwareModule } from '@alliage/lifecycle';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

// Define your JSON schema for validation
const schema = {
  type: 'object',
  required: ['host', 'port', 'credentials'],
  properties: {
    host: { type: 'string' },
    port: { type: 'number' },
    credentials: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' }
      }
    }
  }
};

export class MyModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig('webserver', validators.jsonSchema(schema))
    };
  }
}

export default MyModule;
```

The `loadConfig` function takes two parameters:
1. The name of your configuration file (without the `.yaml` extension)
2. A validation function that you can create using the `validators.jsonSchema` helper

### Validating Configuration Files

Validation ensures that users don't input invalid parameters that could break your application. There are two ways to validate a configuration file:

1. Create your own validation function that throws an error if the configuration is invalid
2. Use the built-in `validators.jsonSchema` helper with a [JSON Schema](https://json-schema.org/)

For the example above, we used a JSON schema to validate our configuration file. This schema ensures that:
- The configuration is an object
- It has required properties: `host`, `port`, and `credentials`
- Each property has the correct type
- The `credentials` object has required `username` and `password` properties

### Injecting Environment Variables

You can make your application configurable through environment variables, which is useful for:
- Hiding sensitive data like passwords or API keys
- Having different configurations based on the execution environment
- And more

To inject environment variables in your configuration file, use the `$(ENV_VARIABLE_NAME)` syntax:

```yaml
# config/webserver.yaml
host: 127.0.0.1
port: 8080
credentials:
  username: '$(WEBSERVER_USERNAME)'
  password: '$(WEBSERVER_PASSWORD)'
```

#### Type Conversion

Since environment variables are always strings, you can convert them to other types using this syntax:

```yaml
# config/webserver.yaml
host: 127.0.0.1
port: '$(WEBSERVER_PORT:number)' # convert to number
use_https: '$(WEBSERVER_USE_HTTPS:boolean)' # convert to boolean
whitelisted_ips: '$(WEBSERVER_WHITELISTED_IPS:array)' # convert to array
credentials: '$(WEBSERVER_CREDENTIALS:json)' # parse as JSON
```

Available conversions:
- `number`: Converts the value to a number using `parseFloat`
- `boolean`: Returns `false` if the value is `undefined`, `"0"`, or `"false"`, otherwise returns `true`
- `array`: Splits the string into an array of strings using `,` as a separator
- `json`: Parses the value as JSON using `JSON.parse`

#### Default Values

You can provide default values for environment variables that might not be defined using the `?` operator:

```yaml
# config/webserver.yaml
host: '$(WEBSERVER_HOST?127.0.0.1)'
port: '$(WEBSERVER_PORT:number?8080)'
use_https: '$(WEBSERVER_USE_HTTPS:boolean?true)'
whitelisted_ips: '$(WEBSERVER_WHITELISTED_IPS:array?192.168.0.12,192.168.0.25)'
credentials: '$(WEBSERVER_CREDENTIALS:json?{"username": "johndoe", "password": "411!463|20(|(5"})'
```

### Accessing Configuration Parameters

Once loaded, the configuration is injected into the [service container parameters](../dependency-injection#parameterpath-string--parameters-object--stringbooleannumberobjectarray), allowing you to access them in your services:

#### JavaScript Example

```javascript
// MyModule.js
import { AbstractLifeCycleAwareModule, INIT_EVENTS } from '@alliage/lifecycle';
import { parameter } from '@alliage/di';
import { MyService } from './MyService.js';

export class MyModule extends AbstractLifeCycleAwareModule {
  // ...

  registerServices(serviceContainer) {
    serviceContainer.registerService('my_service', MyService, [
      parameter('webserver.host'),
      parameter('webserver.port'),
      parameter('webserver.credentials.username'),
      parameter('webserver.credentials.password')
    ]);
  }
}

export default MyModule;
```

#### TypeScript Example

```typescript
// MyModule.ts
import { AbstractLifeCycleAwareModule, INIT_EVENTS } from '@alliage/lifecycle';
import { ServiceContainer, parameter } from '@alliage/di';
import { MyService } from './MyService.js';

export class MyModule extends AbstractLifeCycleAwareModule {
  // ...

  registerServices(serviceContainer: ServiceContainer): void {
    serviceContainer.registerService('my_service', MyService, [
      parameter('webserver.host'),
      parameter('webserver.port'),
      parameter('webserver.credentials.username'),
      parameter('webserver.credentials.password')
    ]);
  }
}

export default MyModule;
```

The parameter path starts with the name of your configuration file (without the `.yaml` extension), followed by the tree structure of your configuration.

## Events

### Configuration Events

```javascript
import { CONFIG_EVENTS } from '@alliage/config-loader';
```

| Event Type | Event Object | Description |
|------------|--------------|-------------|
| `CONFIG_EVENTS.PRE_LOAD` | [ConfigPreLoadEvent](#configpreloadevent) | Triggered before loading all configuration files |
| `CONFIG_EVENTS.LOAD` | [ConfigLoadEvent](#configloadevent) | Used for registering configuration files and validators |
| `CONFIG_EVENTS.PRE_FILE_LOAD` | [ConfigPreFileLoadEvent](#configprefileloadevent) | Triggered before reading a configuration file |
| `CONFIG_EVENTS.PRE_FILE_PARSE` | [ConfigPreFileParseEvent](#configprefileparseevent) | Triggered before parsing YAML content |
| `CONFIG_EVENTS.POST_FILE_PARSE` | [ConfigPostFileParseEvent](#configpostfileparseevent) | Triggered after parsing YAML content |
| `CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION` | [ConfigPostEnvVariableInjectionEvent](#configpostenvvariableinjectionevent) | Triggered after injecting environment variables |
| `CONFIG_EVENTS.POST_FILE_LOAD` | [ConfigPostFileLoadEvent](#configpostfileloadevent) | Triggered after loading a configuration file into the service container |
| `CONFIG_EVENTS.POST_LOAD` | [ConfigPostLoadEvent](#configpostloadevent) | Triggered after loading all configuration files |

#### ConfigPreLoadEvent

This event is received in any `CONFIG_EVENTS.PRE_LOAD` listener.

- `getConfigPath(): string`: Returns the path of the configuration files folder
- `getConfigs(): { fileName: string, validator: Function}[]`: Returns the list of configs (usually empty at this point)
- `setConfigPath(path: string): ConfigPreLoadEvent`: Redefines the config files folder path
- `setConfigs(configs: { fileName: string, validator: Function}[]): ConfigPreLoadEvent`: Redefines the configs list

#### ConfigLoadEvent

This event is received in any `CONFIG_EVENTS.LOAD` listener.

- `getConfigs(): { fileName: string, validator: Function}[]`: Returns the list of configs
- `setConfigs(configs: { fileName: string, validator: Function}[]): ConfigLoadEvent`: Redefines the configs list
- `addConfig(configs: { fileName: string, validator: Function}): ConfigLoadEvent`: Adds a new config to the list

#### ConfigPreFileLoadEvent

This event is received in any `CONFIG_EVENTS.PRE_FILE_LOAD` listener.

- `getConfigPath(): string`: Returns the path of the configuration files folder
- `getFileName(): string`: Returns the name of the config about to be loaded
- `getFilePath(): string`: Returns the path of the config file about to be loaded
- `setFilePath(path: string): ConfigPreFileLoadEvent`: Redefines the config file path

#### ConfigPreFileParseEvent

This event is received in any `CONFIG_EVENTS.PRE_FILE_PARSE` listener.

- `getFileName(): string`: Returns the name of the config about to be parsed
- `getFilePath(): string`: Returns the path of the config file about to be parsed
- `getContent(): string`: Returns the raw content of the config file about to be parsed
- `setContent(content: string): ConfigPreFileParseEvent`: Redefines the raw content of the config file about to be parsed

#### ConfigPostFileParseEvent

This event is received in any `CONFIG_EVENTS.POST_FILE_PARSE` listener.

- `getFileName(): string`: Returns the name of the parsed config
- `getFilePath(): string`: Returns the path of the parsed config file
- `getConfig(): object`: Returns the parsed content of the config
- `setConfig(config: object): ConfigPostFileParseEvent`: Redefines the parsed content of the config

#### ConfigPostEnvVariableInjectionEvent

This event is received in any `CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION` listener.

- `getFileName(): string`: Returns the name of the config
- `getFilePath(): string`: Returns the path of the config file
- `getConfig(): object`: Returns the content of the config with injected environment variables
- `setConfig(config: object): ConfigPostEnvVariableInjectionEvent`: Redefines the content of the config

#### ConfigPostFileLoadEvent

This event is received in any `CONFIG_EVENTS.POST_FILE_LOAD` listener.

- `getFileName(): string`: Returns the name of the config that was loaded
- `getFilePath(): string`: Returns the path of the config file that was loaded

#### ConfigPostLoadEvent

This event is received in any `CONFIG_EVENTS.POST_LOAD` listener.

- `getConfigs(): string[]`: Returns the names of the configs that were loaded
