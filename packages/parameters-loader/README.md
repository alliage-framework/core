# Alliage Parameters Loader

A robust configuration module that provides a flexible way to store and access application parameters within your Alliage projects.

## Overview

This module creates a centralized parameters storage system that any part of your application can access. Define your application's configuration parameters once in a YAML file and consume them anywhere in your services.

## Dependencies

- [@alliage/di](../dependency-injection) - Dependency injection system
- [@alliage/lifecycle](../lifecycle) - Application lifecycle management
- [@alliage/module-installer](../module-installer) - Module installation utilities
- [@alliage/config-loader](../configuration-loader) - Configuration loading system

## Installation

Using yarn:

```bash
yarn add @alliage/parameters-loader
```

Using npm:

```bash
npm install @alliage/parameters-loader
```

## Registration

### Automatic Registration

If you have already installed [@alliage/module-installer](../module-installer), simply run:

```bash
$(npm bin)/alliage-scripts install @alliage/parameters-loader
```

### Manual Registration

Alternatively, update your `alliage-modules.json` file to include:

```json
{
  // ... other modules
  "@alliage/parameters-loader": {
    "module": "@alliage/parameters-loader",
    "deps": [
      "@alliage/lifecycle",
      "@alliage/di",
      "@alliage/module-installer",
      "@alliage/config-loader"
    ],
    "envs": []
  }
}
```

## Usage

Once installed, a new configuration file will be available at `config/parameters.yaml`. This file accepts any valid YAML structure according to your application's needs.

### Example Parameters Configuration

```yaml
# config/parameters.yaml
webserver:
  host: 127.0.0.1
  port: 8080
  credentials:
    username: johnsmith
    password: '411!463|20(|(5'
```

### Using Parameters in Your Services

After defining your parameters, they can be injected into any service through the dependency injection system.

#### JavaScript Example

```js
// MyModule.js
import { AbstractLifeCycleAwareModule, INIT_EVENTS, RUN_EVENTS } from '@alliage/lifecycle';
import { parameter } from '@alliage/di';

import { MyService } from './MyService.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  // ... other module methods
  
  registerServices(serviceContainer) {
    serviceContainer.registerService('my_service', MyService, [
      parameter('parameters.webserver.host'),
      parameter('parameters.webserver.port'),
      parameter('parameters.webserver.credentials'),
    ]);
  }
}
```

#### TypeScript Example

```ts
// MyModule.ts
import { AbstractLifeCycleAwareModule, INIT_EVENTS, RUN_EVENTS } from '@alliage/lifecycle';
import { ServiceContainer, parameter } from '@alliage/di';

import { MyService } from './MyService.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  // ... other module methods
  
  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService('my_service', MyService, [
      parameter('parameters.webserver.host'),
      parameter('parameters.webserver.port'),
      parameter('parameters.webserver.credentials'),
    ]);
  }
}
```

In both examples, the parameters are accessed using dot notation paths that match your YAML structure. The dependency injection system will automatically resolve and inject these values into your service constructor.