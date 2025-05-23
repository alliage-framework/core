# Alliage Service Loader

Simplify your application architecture with automatic import and registration of services.

## Dependencies

- [@alliage/di](../dependency-injection) - Dependency injection system
- [@alliage/lifecycle](../lifecycle) - Application lifecycle management 
- [@alliage/module-installer](../module-installer) - Module installation utilities
- [@alliage/config-loader](../configuration-loader) - Configuration management

## Installation

```bash
yarn add @alliage/service-loader
```

Or with npm:

```bash
npm install @alliage/service-loader
```

## Registration

If you've already installed [@alliage/module-installer](../module-installer), simply run:

```bash
$(npm bin)/alliage-scripts install @alliage/service-loader
```

Otherwise, update your `alliage-modules.json` file by adding:

```json
{
  // ... other modules
  "@alliage/service-loader": {
    "module": "@alliage/service-loader",
    "deps": [
      "@alliage/lifecycle",
      "@alliage/di",
      "@alliage/module-installer",
      "@alliage/config-loader"
    ],
    "envs": [],
  }
}
```

## Usage

This module enables you to import and register services automatically without creating dedicated Alliage modules, streamlining your development process.

### Configuration

Upon installation, a `config/services.yaml` file will be created with default settings:

```yaml
basePath: 'src'
paths: ['services/**/*']
exclude: ['services/**/NotAService.*']
```

- `basePath`: The root directory where your application source code resides
- `paths`: Glob patterns that define which files should be treated as services for automatic import and registration
- `exclude`: Glob patterns to exclude files that may match one of the `paths` patterns but should not be treated as services

### Defining a Service

To define a service, follow these rules:

1. The file path must match the patterns defined in `config/services.yaml`
2. The service must be exported as the `default` export
3. The service must be declared using the `Service` decorator

#### JavaScript Example (ES modules)

```javascript
import { Service } from '@alliage/service-loader';
import { service, parameter } from '@alliage/di';

class MyService {
  constructor(otherService, dummyParameter) {
    this.otherService = otherService;
    this.dummyParameter = dummyParameter;
  }

  performAction() {
    // Service implementation
    return `Using ${this.dummyParameter} with ${this.otherService.getName()}`;
  }
}

export default Service('my_service', [
  service('other_service'),
  parameter('parameters.dummy_parameter'),
])(MyService);
```

#### TypeScript Example (ES modules)

```typescript
import { Service } from '@alliage/service-loader';
import { service, parameter, Dependency } from '@alliage/di';

interface OtherService {
  getName(): string;
}

@Service('my_service', [
  service('other_service'),
  parameter('parameters.dummy_parameter'),
])
export default class MyService {
  private otherService: OtherService;
  private dummyParameter: string;

  constructor(otherService: OtherService, dummyParameter: string) {
    this.otherService = otherService;
    this.dummyParameter = dummyParameter;
  }

  performAction(): string {
    // Service implementation
    return `Using ${this.dummyParameter} with ${this.otherService.getName()}`;
  }
}
```

The `Service` decorator accepts:
- A unique service name (string)
- An array of dependencies (optional)

Once defined, your service will be automatically loaded and registered in the dependency injection container.

## Events

The module provides several events that allow you to hook into the service loading process.

### Service Loader Events

```typescript
// TypeScript
import { SERVICE_LOADER_EVENTS } from '@alliage/service-loader';
```


| Event Type | Event Object | Description |
|------------|--------------|-------------|
| `SERVICE_LOADER_EVENTS.BEFORE_ALL` | [ServiceLoaderBeforeAllEvent](#serviceloaderbeforeallevent) | Triggered before loading any services |
| `SERVICE_LOADER_EVENTS.BEFORE_ONE` | [ServiceLoaderBeforeOneEvent](#serviceloaderbeforeoneevent) | Triggered before loading a specific service |
| `SERVICE_LOADER_EVENTS.AFTER_ONE` | [ServiceLoaderAfterOneEvent](#serviceloaderafteroneevent) | Triggered after loading a specific service |
| `SERVICE_LOADER_EVENTS.AFTER_ALL` | [ServiceLoaderAfterAllEvent](#serviceloaderafterallevent) | Triggered after loading all services |

#### ServiceLoaderBeforeAllEvent

Available methods for this event, triggered by `SERVICE_LOADER_EVENTS.BEFORE_ALL`:

- `getBasePath(): string` - Returns the base path configured in the configuration file
- `getPaths(): string[]` - Returns the paths configured in the configuration file
- `getExclude(): string[]` - Returns the exclusion patterns configured in the configuration file
- `setPaths(paths: string[]): ServiceLoaderBeforeAllEvent` - Allows modifying the paths to be used
- `setExclude(exclude: string[]): ServiceLoaderBeforeAllEvent` - Allows modifying the exclusion patterns

#### ServiceLoaderBeforeOneEvent

Available methods for this event, triggered by `SERVICE_LOADER_EVENTS.BEFORE_ONE`:

- `getModulePath(): string` - Returns the path of the service file being loaded
- `getName(): string` - Returns the unique name of the service being loaded
- `getConstructor(): any` - Returns the constructor function of the service being loaded
- `getDependencies(): Dependency[]` - Returns the dependencies of the service being loaded
- `setConstructor(constructor: any): ServiceLoaderBeforeOneEvent` - Allows modifying the constructor before registration
- `setDependencies(dependencies: Dependency[]): ServiceLoaderBeforeOneEvent` - Allows modifying the dependencies before registration

#### ServiceLoaderAfterOneEvent

Available methods for this event, triggered by `SERVICE_LOADER_EVENTS.AFTER_ONE`:

- `getModulePath(): string` - Returns the path of the loaded service file
- `getName(): string` - Returns the unique name of the loaded service
- `getConstructor(): any` - Returns the constructor function of the loaded service
- `getDependencies(): Dependency[]` - Returns the dependencies of the loaded service

#### ServiceLoaderAfterAllEvent

Available methods for this event, triggered by `SERVICE_LOADER_EVENTS.AFTER_ALL`:

- `getBasePath(): string` - Returns the base path that was used
- `getPaths(): string[]` - Returns the paths that were used
- `getExclude(): string[]` - Returns the exclusion patterns that were used
