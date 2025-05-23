# Alliage Builder

A powerful build pipeline system for Alliage applications that streamlines your development workflow.

## Dependencies

- [@alliage/lifecycle](../lifecycle)
- [@alliage/config-loader](../configuration-loader)
- [@alliage/module-installer](../module-installer)

## Installation

```bash
# Using yarn
yarn add -D @alliage/builder

# Using npm
npm install --save-dev @alliage/builder
```

## Registration

If you've already installed [@alliage/module-installer](../module-installer), simply run:

```bash
$(npm bin)/alliage-scripts install @alliage/builder
```

Otherwise, update your `alliage-modules.json` file by adding this to the bottom:

```json
{
  // ... other modules
  "@alliage/builder": {
    "module": "@alliage/builder",
    "deps": [
      "@alliage/lifecycle",
      "@alliage/config-loader",
      "@alliage/module-installer"
    ],
    "envs": ["development"]
  }
}
```

## Usage

### Creating a Custom Builder Task

To leverage the builder module, first create a task by extending the `AbstractTask` class and registering it as a service.

#### JavaScript Example

```js
// MyTask.js
import { AbstractTask } from '@alliage/builder';

export class MyTask extends AbstractTask {
  getName() {
    return 'my_task';
  }

  getParamsSchema() {
    return {
      type: 'object',
      properties: {
        myTaskParam: {
          type: 'string',
        },
      },
    };
  }

  async run(params) {
    console.log(`Parameter received: ${params.myTaskParam}`);

    // Implement your build logic here...
  }
}
```

#### TypeScript Example

```ts
// MyTask.ts
import { AbstractTask } from '@alliage/builder';
import { FromSchema } from 'json-schema-to-ts';

export class MyTask extends AbstractTask {
  getName(): string {
    return 'my_task';
  }

  getParamsSchema() {
    return {
      type: 'object',
      properties: {
        myTaskParam: {
          type: 'string',
        },
      },
    } as const;
  }

  async run(params: FromSchema<ReturnType<typeof this.getParamsSchema>>): Promise<void> {
    console.log(`Parameter received: ${params.myTaskParam}`);

    // Implement your build logic here...
  }
}
```

Your task must implement these methods:

- `getName(): string`: Returns a unique name for the task
- `getParamsSchema(): object`: Returns the JSON schema for parameters accepted by the task
- `run(params: object)`: Contains the build logic and receives parameters that conform to the schema

### Registering Your Task as a Service

Once your task is created, register it as a service:

#### With @alliage/service-loader

If you have [@alliage/service-loader](../service-loader) installed, use the Service decorator:

##### JavaScript Example

```js
// MyTask.js
import { AbstractTask } from '@alliage/builder';
import { Service } from '@alliage/service-loader';

class MyTask extends AbstractTask {
  // Implementation as shown above
}

export default Service('my_task')(MyTask);
```

##### TypeScript Example

```ts
// MyTask.ts
import { AbstractTask } from '@alliage/builder';
import { Service } from '@alliage/service-loader';
import { FromSchema } from 'json-schema-to-ts';

@Service('my_task')
export default class MyTask extends AbstractTask {
  // Implementation as shown above
}
```

#### Without @alliage/service-loader

Register the task directly in an Alliage module:

##### JavaScript Example

```js
// MyModule.js
import { AbstractLifeCycleAwareModule } from '@alliage/lifecycle';
import { MyTask } from './MyTask.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  // ...other methods

  registerServices(serviceContainer) {
    serviceContainer.registerService('my_task', MyTask, []);
  }
}
```

##### TypeScript Example

```ts
// MyModule.ts
import { AbstractLifeCycleAwareModule } from '@alliage/lifecycle';
import { ServiceContainer } from '@alliage/di';
import { MyTask } from './MyTask.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  // ...other methods

  registerServices(serviceContainer: ServiceContainer): void {
    serviceContainer.registerService('my_task', MyTask, []);
  }
}
```

### Configuration

Once your task is created, configure the builder to use it in the `config/builder.yaml` file:

```yaml
tasks:
  - name: my_task         # Name of the task to execute
    description: My task  # Description of the task (displayed in the terminal)
    params:               # Parameters sent to the task
      myTaskParam: foo
```

### Running the Build

Execute the build with the following command:

```bash
npx alliage-scripts build
```

With the example above, you should see:

```bash
Running task: My task...
Parameter received: foo
```

### Built-in Tasks

#### ShellTask

The builder module includes a built-in ShellTask for running shell commands:

```yaml
tasks:
  - name: shell
    description: Compile TypeScript code
    params:
      cmd: tsc -p tsconfig.json
  - name: shell
    description: Generate static documentation
    params:
      cmd: swagger-codegen generate -i api/specs -l html2 -o api/doc
```

## Events

### Builder Events

```js
import { BUILDER_EVENTS } from '@alliage/builder';
```

| Event Type | Event Object | Description |
|------------|--------------|-------------|
| `BUILDER_EVENTS.BEFORE_ALL_TASKS` | [BuilderBeforeAllTasksEvent](#builderbeforealltasksevent) | Triggered before running all tasks |
| `BUILDER_EVENTS.BEFORE_TASK` | [BuilderBeforeTaskEvent](#builderbeforetaskevent) | Triggered before running a specific task |
| `BUILDER_EVENTS.AFTER_TASK` | [BuilderAfterTaskEvent](#builderaftertaskevent) | Triggered after running a specific task |
| `BUILDER_EVENTS.AFTER_ALL_TASKS` | [BuilderAfterAllTasksEvent](#builderafteralltasksevent) | Triggered after running all tasks |

#### BuilderBeforeAllTasksEvent

This event object is received in any `BUILDER_EVENTS.BEFORE_ALL_TASKS` listener.

- `getConfig(): object`: Returns the builder configuration
- `getTasks(): { [name: string]: AbstractTask }`: Returns available tasks
- `setConfig(config: object): BuilderBeforeAllTasksEvent`: Redefines the builder configuration

#### BuilderBeforeTaskEvent

This event object is received in any `BUILDER_EVENTS.BEFORE_TASK` listener.

- `getTask(): AbstractTask`: Returns the task about to run
- `getParams(): object`: Returns the parameters for the task
- `getDescription(): string`: Returns the task description
- `setParams(params: object): BuilderBeforeTaskEvent`: Redefines the task parameters
- `setDescription(description: string): BuilderBeforeTaskEvent`: Redefines the task description

#### BuilderAfterTaskEvent

This event object is received in any `BUILDER_EVENTS.AFTER_TASK` listener.

- `getTask(): AbstractTask`: Returns the task that was run
- `getParams(): object`: Returns the parameters sent to the task
- `getDescription(): string`: Returns the description of the task

#### BuilderAfterAllTasksEvent

This event object is received in any `BUILDER_EVENTS.AFTER_ALL_TASKS` listener.

- `getConfig(): object`: Returns the builder configuration
- `getTasks(): { [name: string]: AbstractTask }`: Returns available tasks

### Shell Task Events

```js
import { BUILDER_SHELL_TASK_EVENTS } from '@alliage/builder';
```

| Event Type | Event Object | Description |
|------------|--------------|-------------|
| `BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN` | [ShellTaskBeforeRunEvent](#shelltaskbeforerunevent) | Triggered before running the shell task |
| `BUILDER_SHELL_TASK_EVENTS.SUCCESS` | [ShellTaskSuccessEvent](#shelltasksuccessevent) | Triggered after a successful shell task run |
| `BUILDER_SHELL_TASK_EVENTS.ERROR` | [ShellTaskErrorEvent](#shelltaskerrorevent) | Triggered after a failed shell task run |

#### ShellTaskBeforeRunEvent

This event object is received in any `BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN` listener.

- `getCommand(): string`: Returns the command about to run
- `setCommand(command: string): ShellTaskBeforeRunEvent`: Redefines the command

#### ShellTaskSuccessEvent

This event object is received in any `BUILDER_SHELL_TASK_EVENTS.SUCCESS` listener.

- `getCommand(): string`: Returns the command that was run
- `getSuccessOutput(): string`: Returns the standard output
- `getErrorOutput(): string`: Returns the error output

#### ShellTaskErrorEvent

This event object is received in any `BUILDER_SHELL_TASK_EVENTS.ERROR` listener.

- `getCommand(): string`: Returns the command that was run
- `getError(): CommandError`: Returns the error with these properties:
  - `stdout (string)`: The standard output
  - `stderr (string)`: The error output
  - `error: (ExecException)`: The native error


