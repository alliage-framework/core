# Alliage Dependency Injection

A powerful, flexible dependency injection module for Alliage applications that automates service instantiation and dependency management.

## Installation

```bash
# Using yarn
yarn add @alliage/di

# Using npm
npm install @alliage/di
```

## Registration

Add the module to your `alliage-modules.json` file:

```json
{
  // ... other modules
  "@alliage/di": {
    "module": "@alliage/di",
    "deps": [],
    "envs": []
  }
}
```

## Usage

Once installed and registered, this module automatically injects a `service_container` object into the `PrimitiveContainer` that your event handlers receive (provided your module has a dependency on `@alliage/di`):

### JavaScript Example

```js
// my-module.js
import { AbstractModule } from '@alliage/framework';

export default class MyFirstModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args, env, container) => {
    // Access the ServiceContainer
    const serviceContainer = container.get('service_container');
    
    // Use it to register and retrieve services
    // ...
  };
}
```

### TypeScript Example

```ts
// my-module.ts
import { AbstractModule, Arguments, PrimitiveContainer } from '@alliage/framework';
import { ServiceContainer } from '@alliage/di';

export default class MyFirstModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    // Access the ServiceContainer with type information
    const serviceContainer = container.get('service_container') as ServiceContainer;
    
    // Use it to register and retrieve services
    // ...
  };
}
```

## Service Container API

The service container manages service registration, instantiation, and dependency resolution, automatically providing services with their required dependencies.

### `registerService(name: string, constructor: Constructor, dependencies: Dependency[])`

Registers a new service with the container.

#### Parameters:

- **name** (`string`): A unique identifier for your service
- **constructor** (`Constructor`): The service class
- **dependencies** (`Dependency[]`): Dependencies to inject into the constructor

#### JavaScript Example:

```js
import { service } from '@alliage/di';

class DatabaseService {
  constructor(config) {
    this.config = config;
    // Initialize database connection
  }

  query(sql) {
    // Run query against database
  }
}

class UserRepository {
  constructor(dbService) {
    this.dbService = dbService;
  }

  findById(id) {
    return this.dbService.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Register services
serviceContainer.registerService(
  'database_service',
  DatabaseService,
  [service('config_service')]
);

serviceContainer.registerService(
  'user_repository',
  UserRepository,
  [service('database_service')]
);
```

#### TypeScript Example:

```ts
import { service } from '@alliage/di';

interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
}

class DatabaseService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    // Initialize database connection
  }

  query(sql: string): any {
    // Run query against database
  }
}

class UserRepository {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  findById(id: number): any {
    return this.dbService.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Register services
serviceContainer.registerService(
  'database_service',
  DatabaseService,
  [service('config_service')]
);

serviceContainer.registerService(
  'user_repository',
  UserRepository,
  [service('database_service')]
);
```

### `addService(name: string, service: object)`

Registers an already instantiated service with the container.

#### Parameters:

- **name** (`string`): A unique identifier for your service
- **service** (`object`): The service instance

#### Example:

```ts
import { LoggerService } from './LoggerService.js';

// Create a service instance manually
const logger = new LoggerService('debug');

// Add the existing instance to the container
serviceContainer.addService('logger', logger);
```


### `setParameter(name: string, value: string|boolean|number|object|array)`

Sets a parameter value in the container.

#### Parameters:

- **name** (`string`): A unique parameter name
- **value** (`string|boolean|number|object|array`): The parameter value

#### Example:

```ts
// Set various parameter types
serviceContainer.setParameter('api_key', 'abc123xyz');
serviceContainer.setParameter('debug_mode', true);
serviceContainer.setParameter('timeout', 30000);
serviceContainer.setParameter('allowed_origins', ['localhost', 'example.com']);
serviceContainer.setParameter('database', {
  host: 'localhost',
  port: 5432,
  credentials: {
    username: 'admin',
    password: 'secure_password'
  }
});
```

### `getService(name: string)`

Retrieves a service by its name.

#### Parameters:

- **name** (`string`): The service name

#### JavaScript Example:

```js
// Get the user repository service
const userRepository = serviceContainer.getService('user_repository');

// Use the service
const user = userRepository.findById(42);
```

#### TypeScript Example:

```ts
// Get the user repository service with type information
const userRepository = serviceContainer.getService<UserRepository>('user_repository');

// Use the service
const user = userRepository.findById(42);
```

### `getInstanceOf(ctor: Constructor)`

Finds and returns a service that is an instance of the specified constructor.

#### Parameters:

- **ctor** (`Constructor`): A class constructor to match

#### JavaScript Example:

```js
import { Repository } from './Repository.js';

// Get the first service that extends Repository
const repository = serviceContainer.getInstanceOf(Repository);
```

#### TypeScript Example:

```ts
import { Repository } from './Repository.js';

// Get the first service that extends Repository
const repository = serviceContainer.getInstanceOf<Repository>(Repository);
```

### `getAllInstancesOf(ctor: Constructor)`

Returns all services that are instances of the specified constructor.

#### Parameters:

- **ctor** (`Constructor`): A class constructor to match

#### JavaScript Example:

```js
import { Repository } from './Repository.js';

// Get all services that extend Repository
const repositories = serviceContainer.getAllInstancesOf(Repository);

// Use them
repositories.forEach(repo => {
  console.log(repo.constructor.name);
});
```

#### TypeScript Example:

```ts
import { Repository } from './Repository.js';

// Get all services that extend Repository
const repositories = serviceContainer.getAllInstancesOf<Repository>(Repository);

// Use them
repositories.forEach(repo => {
  console.log(repo.constructor.name);
});
```

### `getParameter(path: string)`

Retrieves a parameter value by path.

#### Parameters:

- **path** (`string`): Path to the parameter value

#### JavaScript Example:

```js
// Get a simple parameter
const apiKey = serviceContainer.getParameter('api_key');

// Get a nested parameter
const dbUsername = serviceContainer.getParameter('database.credentials.username');

// Get an array item
const firstAllowedOrigin = serviceContainer.getParameter('allowed_origins[0]');
```

#### TypeScript Example:

```ts
// Get a simple parameter with type assertion
const apiKey = serviceContainer.getParameter<string>('api_key');

// Get a nested parameter
const dbUsername = serviceContainer.getParameter<string>('database.credentials.username');

// Get an array item
const firstAllowedOrigin = serviceContainer.getParameter<string>('allowed_origins[0]');
```

### `getDependency(dependency: Dependency)`

Resolves and returns a dependency.

#### Parameters:

- **dependency** (`Dependency`): A dependency specification

#### JavaScript Example:

```js
import { service, parameter, instanceOf, allInstancesOf } from '@alliage/di';
import { Repository } from './Repository.js';

// Get different kinds of dependencies
const logger = serviceContainer.getDependency(service('logger'));
const apiKey = serviceContainer.getDependency(parameter('api_key'));
const repository = serviceContainer.getDependency(instanceOf(Repository));
const allRepositories = serviceContainer.getDependency(allInstancesOf(Repository));
```

#### TypeScript Example:

```ts
import { service, parameter, instanceOf, allInstancesOf } from '@alliage/di';
import { Repository } from './Repository.js';
import { LoggerService } from './LoggerService.js';

// Get different kinds of dependencies with type information
const logger = serviceContainer.getDependency<LoggerService>(service('logger'));
const apiKey = serviceContainer.getDependency<string>(parameter('api_key'));
const repository = serviceContainer.getDependency<Repository>(instanceOf(Repository));
const allRepositories = serviceContainer.getDependency<Repository[]>(allInstancesOf(Repository));
```

### `freeze()`

Freezes the service container, preventing further modifications to registered services and parameters.

#### Example:

```ts
// Register all services and parameters
// ...

// Freeze the container to prevent further modifications
serviceContainer.freeze();

// This would throw an error:
// serviceContainer.registerService('new_service', NewService, []);
```

## Dependency Types

The `@alliage/di` module provides different types of dependencies that can be injected into your services.

### `service(name: string)`

Creates a dependency reference to a service by name.

### `instanceOf(constructor: Constructor)`

Creates a dependency reference to a service by constructor type. It will match any service instance or subclass of the specified constructor.

### `allInstancesOf(constructor: Constructor)`

Similar to `instanceOf`, but retrieves all matching services as an array.

### `parameter(path: string | (parameters: object) => any)`

Creates a dependency reference to a parameter by path or using a custom getter function.

The path can be either:
- A string path like `'database.credentials.username'`
- A function that receives all parameters and returns the desired value

### Default Dependencies

The service container automatically provides:

- `service('service_container')`: The container itself
- `parameter('environment')`: The current execution environment from the `--env` argument

## Complete Example

Here's how to use the dependency injection module in a complete example:

### JavaScript Example

```js
import { AbstractModule } from '@alliage/framework';
import { service, parameter, instanceOf } from '@alliage/di';

// Define services
class ConfigService {
  constructor(environment) {
    this.environment = environment;
    this.config = this.loadConfig(environment);
  }

  loadConfig(env) {
    // Load configuration based on environment
    return {
      database: {
        host: env === 'production' ? 'prod-db.example.com' : 'localhost',
        port: 5432
      }
    };
  }

  get(path) {
    // Get configuration value by path
    return path.split('.').reduce((obj, key) => obj[key], this.config);
  }
}

class DatabaseService {
  constructor(configService) {
    this.config = configService;
    // Initialize DB connection using config
  }

  query(sql) {
    // Execute query
    console.log(`Running query on ${this.config.get('database.host')}`);
  }
}

export default class MyModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args, env, container) => {
    const serviceContainer = container.get('service_container');
    
    // Register services
    serviceContainer.registerService(
      'config_service',
      ConfigService,
      [parameter('environment')]
    );
    
    serviceContainer.registerService(
      'database_service',
      DatabaseService,
      [service('config_service')]
    );
    
    // Use services
    const dbService = serviceContainer.getService('database_service');
    dbService.query('SELECT * FROM users');
    
    // Freeze the container
    serviceContainer.freeze();
  };
}
```

### TypeScript Example

```ts
import { AbstractModule, Arguments, PrimitiveContainer } from '@alliage/framework';
import { ServiceContainer, service, parameter, instanceOf } from '@alliage/di';

// Define services with types
class ConfigService {
  private environment: string;
  private config: Record<string, any>;

  constructor(environment: string) {
    this.environment = environment;
    this.config = this.loadConfig(environment);
  }

  private loadConfig(env: string): Record<string, any> {
    // Load configuration based on environment
    return {
      database: {
        host: env === 'production' ? 'prod-db.example.com' : 'localhost',
        port: 5432
      }
    };
  }

  get(path: string): any {
    // Get configuration value by path
    return path.split('.').reduce((obj, key) => obj[key], this.config);
  }
}

class DatabaseService {
  private config: ConfigService;

  constructor(configService: ConfigService) {
    this.config = configService;
    // Initialize DB connection using config
  }

  query(sql: string): void {
    // Execute query
    console.log(`Running query on ${this.config.get('database.host')}`);
  }
}

export default class MyModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    const serviceContainer = container.get('service_container') as ServiceContainer;
    
    // Register services
    serviceContainer.registerService(
      'config_service',
      ConfigService,
      [parameter('environment')]
    );
    
    serviceContainer.registerService(
      'database_service',
      DatabaseService,
      [service('config_service')]
    );
    
    // Use services
    const dbService = serviceContainer.getService<DatabaseService>('database_service');
    dbService.query('SELECT * FROM users');
    
    // Freeze the container
    serviceContainer.freeze();
  };
}
```