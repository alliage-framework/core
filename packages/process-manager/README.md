# Alliage Process Manager

This module allows you to define executable processes through Alliage's run script, serving as entry points to your application.

## Dependencies

- [@alliage/di](../dependency-injection)
- [@alliage/lifecycle](../lifecycle)
- [@alliage/service-loader](../service-loader)
- [@alliage/config-loader](../configuration-loader)

## Installation

```bash
yarn add @alliage/process-manager
```

Or with npm:

```bash
npm install @alliage/process-manager
```

## Registration

If you have already installed [@alliage/module-installer](../module-installer), simply run:

```bash
npx alliage-scripts install @alliage/process-manager
```

Otherwise, update your `alliage-modules.json` file by adding:

```json
{
  // ... other modules
  "@alliage/process-manager": {
    "module": "@alliage/process-manager",
    "deps": [
      "@alliage/di",
      "@alliage/lifecycle",
      "@alliage/service-loader",
      "@alliage/config-loader"
    ],
    "envs": []
  }
}
```

## Usage

### Defining a Process

Processes serve as entry points to your application and typically contain your application's business logic, either directly or indirectly.

Creating a process is straightforward - implement a class that extends `AbstractProcess` and register it as a service.

#### JavaScript Example

```js
// my-process.js
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';

class MyProcess extends AbstractProcess {
  getName() {
    return 'my-process';
  }

  async execute(args, env) {
    process.stdout.write('Hello world!');

    // Return true for successful execution, false for failure
    return true;
  }
}

export default Service('my_process')(MyProcess);
```

#### TypeScript Example

```ts
// my-process.ts
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';
import { Arguments } from '@alliage/framework';

@Service('my_process')
export default class MyProcess extends AbstractProcess {
  getName() {
    return 'my-process';
  }

  async execute(args: Arguments, env: string) {
    process.stdout.write('Hello world!');

    // Return true for successful execution, false for failure
    return true;
  }
}
```

A process class must implement these methods:

- `getName()`: Returns a unique identifier for the process
- `execute(args, env)`: Contains the business logic and returns a boolean or Promise<boolean> indicating success or failure
  - `args`: Arguments passed to the Alliage run script
  - `env`: The execution environment

### Running a Process

Once your process is created, run it with:

```bash
npx alliage-scripts run my-process
```

Where `my-process` is the name defined in your `getName` method. The output will be:

```
Hello world!
```

### Configuring Arguments

You can make your process accept specific arguments by implementing the `configure` method.

#### JavaScript Example

```js
// my-process.js
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';

class MyProcess extends AbstractProcess {
  getName() {
    return 'my-process';
  }

  configure(builder) {
    // Define an argument named "name"
    builder.addArgument('name', {
      type: 'string',
      describe: 'Your name',
    });
  }

  async execute(args, env) {
    // Use the "name" argument in the output
    process.stdout.write(`Hello ${args.get('name')}!`);

    return true;
  }
}

export default Service('my_process')(MyProcess);
```

#### TypeScript Example

```ts
// my-process.ts
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';
import { Arguments, CommandBuilder } from '@alliage/framework';

@Service('my_process')
export default class MyProcess extends AbstractProcess {
  getName() {
    return 'my-process';
  }

  configure(builder: CommandBuilder): void {
    // Define an argument named "name"
    builder.addArgument('name', {
      type: 'string',
      describe: 'Your name',
    });
  }

  async execute(args: Arguments, env: string) {
    // Use the "name" argument in the output
    process.stdout.write(`Hello ${args.get('name')}!`);

    return true;
  }
}
```

The `configure` method receives a `CommandBuilder` instance that allows you to define expected arguments or options.

Now you can run this process with:

```bash
npx alliage-scripts run my-process Bruce
```

And get the output:

```
Hello Bruce!
```

### Handling Process Termination

Processes can stop for various reasons, including:
- Completing their intended task
- Being killed by the system or user
- Encountering unhandled errors
- And more

This module handles these edge cases and lets you perform cleanup operations before shutdown by implementing the `terminate` method.

#### JavaScript Example

```js
// my-process.js
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';
import { service } from '@alliage/di';

class MyProcess extends AbstractProcess {
  constructor(database) {
    super();
    this.database = database;
  }

  getName() {
    return 'my-process';
  }

  async execute(args, env) {
    // Open a database connection
    await this.database.connect();

    // Do stuff...

    return true;
  }

  async terminate(args, env, signal, payload) {
    // Close the connection when the process stops
    await this.database.disconnect();
  }
}

export default Service('my_process', [
  // Dependency injection for database service
  service('database'),
])(MyProcess);
```

#### TypeScript Example

```ts
// my-process.ts
import { AbstractProcess, SIGNAL, SignalPayload } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';
import { service } from '@alliage/di';
import { Arguments } from '@alliage/framework';
import { Database } from './types';

@Service('my_process', [
  // Dependency injection for database service
  service('database'),
])
export default class MyProcess extends AbstractProcess {
  private database: Database;

  constructor(database: Database) {
    super();
    this.database = database;
  }

  getName() {
    return 'my-process';
  }

  async execute(args: Arguments, env: string) {
    // Open a database connection
    await this.database.connect();

    // Do stuff...

    return true;
  }

  async terminate(
    args: Arguments,
    env: string,
    signal: SIGNAL,
    payload: SignalPayload
  ): Promise<void> {
    // Close the connection when the process stops
    await this.database.disconnect();
  }
}
```

The `terminate` method is called whether the process stopped naturally or not and receives:
- `args`: Arguments passed to the Alliage run script
- `env`: The execution environment
- `signal`: The reason for shutdown
- `payload`: Additional contextual information about the shutdown

#### Signal Types

The signal sent to the `terminate` method can have these values:

```ts
import { SIGNAL } from '@alliage/process-manager';

// When the process received a SIGTERM signal
SIGNAL.SIGTERM;

// When the process received a SIGINT signal
SIGNAL.SIGINT;

// In case of uncaught exception
SIGNAL.UNCAUGHT_EXCEPTION;

// In case of unhandled rejection
SIGNAL.UNHANDLED_REJECTION;

// When the process stops naturally with a success return code
SIGNAL.SUCCESS_SHUTDOWN;

// When the process stops naturally with a failure return code
SIGNAL.FAILURE_SHUTDOWN;
```

#### Signal Payload

The payload varies depending on the signal:

For `UNCAUGHT_EXCEPTION`:
```ts
{
  error: Error; // The thrown exception
}
```

For `UNHANDLED_REJECTION`:
```ts
{
  reason: unknown; // The rejection value
  promise: Promise<unknown>; // The rejected promise
}
```

For other signals, the payload will be empty.

### Hanging a Process

By default, a process stops once the `execute` function completes. However, this behavior isn't ideal for long-running processes like web servers.

For such cases, use the `waitToBeShutdown` method to keep the process running until explicitly stopped.

#### JavaScript Example

```js
// server-process.js
import express from 'express';
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';

class ServerProcess extends AbstractProcess {
  getName() {
    return 'server';
  }

  async execute(args, env) {
    const app = express();

    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    // Endpoint to stop the server
    app.get('/shutdown', (req, res) => {
      res.send('Shutting down...');
      // This stops the process
      this.shutdown(true);
    });

    app.listen(8080, () => {
      console.log('Server running on port 8080');
    });

    // This keeps the process running until shutdown is called
    return await this.waitToBeShutdown();
  }
}

export default Service('server_process')(ServerProcess);
```

#### TypeScript Example

```ts
// server-process.ts
import express from 'express';
import { AbstractProcess } from '@alliage/process-manager';
import { Service } from '@alliage/service-loader';
import { Arguments } from '@alliage/framework';

@Service('server_process')
export default class ServerProcess extends AbstractProcess {
  getName(): string {
    return 'server';
  }

  async execute(args: Arguments, env: string): Promise<boolean> {
    const app = express();

    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    // Endpoint to stop the server
    app.get('/shutdown', (req, res) => {
      res.send('Shutting down...');
      // This stops the process
      this.shutdown(true);
    });

    app.listen(8080, () => {
      console.log('Server running on port 8080');
    });

    // This keeps the process running until shutdown is called
    return await this.waitToBeShutdown();
  }
}
```

## Events

### Process Events

```js
import { PROCESS_EVENTS } from '@alliage/process-manager';
```

| Type                            | Event object                              | Description                                         |
| ------------------------------- | ----------------------------------------- | --------------------------------------------------- |
| `PROCESS_EVENTS.PRE_CONFIGURE`  | [PreConfigureEvent](#preconfigureevent)   | Before calling the `configure` method of a process  |
| `PROCESS_EVENTS.POST_CONFIGURE` | [PostConfigureEvent](#postconfigureevent) | After calling the `configure` method of a process   |
| `PROCESS_EVENTS.PRE_EXECUTE`    | [PreExecuteEvent](#preexecuteevent)       | Before executing a process                          |
| `PROCESS_EVENTS.PRE_TERMINATE`  | [PreTerminateEvent](#preterminateevent)   | Before shutting down a process                      |
| `PROCESS_EVENTS.POST_TERMINATE` | [PostTerminateEvent](#postterminateevent) | After shutting down a process                       |

#### PreConfigureEvent

This event is dispatched before a process is configured.

Methods:
- `getProcess(): AbstractProcess`: Returns the process about to be configured
- `getConfig(): CommandBuilder`: Returns the command builder about to be sent to the process
- `getEnv(): string`: Returns the execution environment

#### PostConfigureEvent

This event is dispatched after a process has been configured.

Methods:
- `getProcess(): AbstractProcess`: Returns the configured process
- `getConfig(): CommandBuilder`: Returns the command builder that was sent to the process
- `getEnv(): string`: Returns the execution environment

#### PreExecuteEvent

This event is dispatched before a process is executed.

Methods:
- `getProcess(): AbstractProcess`: Returns the configured process
- `getArgs(): Arguments`: Returns the arguments about to be sent to the process
- `getEnv(): string`: Returns the execution environment
- `setProcess(process: AbstractProcess): PreExecuteEvent`: Allows redefining the process about to be executed

#### PreTerminateEvent

This event is dispatched before a process is terminated.

Methods:
- `getProcess(): AbstractProcess`: Returns the configured process
- `getArgs(): Arguments`: Returns the arguments sent to the process
- `getSignal(): Signal`: Returns the signal sent to the process
- `getSignalPayload(): SignalPayload`: Returns the signal payload sent to the process
- `getEnv(): string`: Returns the execution environment

#### PostTerminateEvent

This event is dispatched after a process has been terminated.

Methods:
- `getProcess(): AbstractProcess`: Returns the configured process
- `getArgs(): Arguments`: Returns the arguments sent to the process
- `getSignal(): Signal`: Returns the signal sent to the process
- `getSignalPayload(): SignalPayload`: Returns the signal payload sent to the process
- `getEnv(): string`: Returns the execution environment
