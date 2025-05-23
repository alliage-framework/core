# Alliage Events Listener Loader

Create event listeners in your Alliage application with minimal configuration and no need to build a full module.

## Dependencies

- [@alliage/di](../dependency-injection)
- [@alliage/lifecycle](../lifecycle)
- [@alliage/service-loader](../service-loader)

## Installation

Using yarn:

```bash
yarn add @alliage/events-listener-loader
```

Using npm:

```bash
npm install @alliage/events-listener-loader
```

## Registration

### Option 1: Using the Module Installer (Recommended)

If you have already installed [@alliage/module-installer](../module-installer), simply run:

```bash
$(npm bin)/alliage-scripts install @alliage/events-listener-loader
```

### Option 2: Manual Registration

Alternatively, update your `alliage-modules.json` file by adding the following configuration:

```json
{
  // ... other modules
  "@alliage/events-listener-loader": {
    "module": "@alliage/events-listener-loader",
    "deps": [
      "@alliage/di",
      "@alliage/lifecycle",
      "@alliage/service-loader"
    ],
    "envs": []
  }
}
```

## Usage

To create an event listener, you need to:

1. Create a class that extends `AbstractEventsListener`
2. Implement the `getEventHandlers()` method
3. Register the class as a service using the `Service` decorator

### JavaScript Example

```js
// my-events-listener.js
import { AbstractEventsListener } from '@alliage/events-listener-loader';
import { RUN_EVENTS } from '@alliage/lifecycle';
import { Service } from '@alliage/service-loader';

class MyEventsListener extends AbstractEventsListener {
  getEventHandlers() {
    return {
      [RUN_EVENTS.PRE_RUN]: this.handlePreRun,
      [RUN_EVENTS.POST_RUN]: this.handlePostRun,
    };
  }

  handlePreRun() {
    process.stdout.write('Test pre run\n');
  }

  handlePostRun() {
    process.stdout.write('Test post run\n');
  }
}

export default Service('my_events_listener')(MyEventsListener);
```

### TypeScript Example

```ts
import { AbstractEventsListener, EventHandlers } from '@alliage/events-listener-loader';
import { RUN_EVENTS, AbstractEvent } from '@alliage/lifecycle';
import { Service } from '@alliage/service-loader';

@Service('my_events_listener')
export default class MyEventsListener extends AbstractEventsListener {
  getEventHandlers(): EventHandlers {
    return {
      [RUN_EVENTS.PRE_RUN]: this.handlePreRun,
      [RUN_EVENTS.POST_RUN]: this.handlePostRun,
    };
  }

  handlePreRun(): void {
    process.stdout.write('Test pre run\n');
  }

  handlePostRun(): void {
    process.stdout.write('Test post run\n');
  }
}
```

The `getEventHandlers()` method should return an object where:
- Keys are the event names you want to listen for
- Values are the handler functions to call when those events occur

Each handler function receives the event object as a parameter and can be synchronous or asynchronous.

## Limitations

Since event listeners are loaded during the application's initialization phase, you cannot listen to events that occur during this phase. Attempting to listen to initialization events will throw an error.

The following initialization events are not available for listening:
- `INIT_EVENTS.PRE_INIT`
- `INIT_EVENTS.INIT`
- `INIT_EVENTS.POST_INIT`