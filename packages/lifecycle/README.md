# Alliage Lifecycle

This module provides enhanced granularity for Alliage events, making it easier to define execution priorities beyond basic module dependencies. It also enables you to trigger custom events in your modules, making them extensible through other modules.

## Dependencies

- [@alliage/di](../dependency-injection)

## Installation

```bash
yarn add @alliage/lifecycle
```

Or with npm:

```bash
npm install @alliage/lifecycle
```

## Registration

Add the following to your `alliage-modules.json` file:

```json
{
  // ... other modules
  "@alliage/lifecycle": {
    "module": "@alliage/lifecycle",
    "deps": ["@alliage/di"],
    "envs": []
  }
}
```

## Usage

### EventManager

The EventManager is a service automatically injected into the [service container](../dependency-injection#service-container).

You can access it directly in your Alliage module:

**JavaScript**
```js
import { AbstractModule } from '@alliage/framework';

export default class MyFirstModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args, env, container) => {
    const serviceContainer = container.get('service_container');

    // Get the EventManager
    const eventManager = serviceContainer.get('event_manager');
  };
}
```

**TypeScript**
```ts
import { AbstractModule, PrimitiveContainer } from '@alliage/framework';
import { ServiceContainer } from '@alliage/di';
import { Arguments } from '@alliage/arguments';
import { EventManager } from '@alliage/lifecycle';

export default class MyFirstModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    const serviceContainer: ServiceContainer = container.get('service_container');

    // Get the EventManager
    const eventManager: EventManager = serviceContainer.get('event_manager');
  };
}
```

Or inject it into any of your services:

**JavaScript**
```js
import { service } from '@alliage/di';

class MyService {
  constructor(eventManager) {
    this.eventManager = eventManager;
  }

  // ...
}

// Register the service with the injected EventManager
serviceContainer.registerService('my_service', MyService, [service('event_manager')]);
```

**TypeScript**
```ts
import { service } from '@alliage/di';
import { EventManager } from '@alliage/lifecycle';

class MyService {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  // ...
}

// Register the service with the injected EventManager
serviceContainer.registerService('my_service', MyService, [service('event_manager')]);
```

The EventManager's API is similar to `EventEmitter` but allows for async listeners that execute sequentially. It offers these key methods:

- `on(eventType: string, listener: (...args: any[]) => void | Promise<void>)`: Subscribes to an event and returns an unsubscribe function
- `emit(eventType: string, ...args: any[])`: Emits an event with the provided arguments

#### AbstractEvent

While you can send any data when emitting events, it's recommended to use the `AbstractEvent` class to structure your event payloads.

Here's an example:

**JavaScript**
```js
import { AbstractEvent } from '@alliage/lifecycle';

// Define event types
const LOGIN_EVENTS = {
  USER_LOGGED_IN: 'LOGIN_EVENTS/USER_LOGGED_IN',
};

// Create a custom event class
class LoginUserLoggedEvent extends AbstractEvent {
  constructor(userId) {
    super(
      LOGIN_EVENTS.USER_LOGGED_IN, // Event type
      { userId }                   // Event payload
    );
  }

  // Helper method for payload access
  getUserId() {
    return this.getPayload().userId;
  }
}

// Usage
const userLoggedEvent = new LoginUserLoggedEvent(42);

console.log(userLoggedEvent.getType());   // "LOGIN_EVENTS/USER_LOGGED_IN"
console.log(userLoggedEvent.getUserId()); // 42

// Emit the event using EventManager
eventManager.emit(userLoggedEvent.getType(), userLoggedEvent);
```

**TypeScript**
```ts
import { AbstractEvent } from '@alliage/lifecycle';

// Define event types
const LOGIN_EVENTS = {
  USER_LOGGED_IN: 'LOGIN_EVENTS/USER_LOGGED_IN',
};

// Define payload interface
interface LoginUserLoggedPayload {
  userId: number;
}

// Create a custom event class
class LoginUserLoggedEvent extends AbstractEvent<LoginUserLoggedPayload> {
  constructor(userId: number) {
    super(
      LOGIN_EVENTS.USER_LOGGED_IN, // Event type
      { userId }                   // Event payload
    );
  }

  // Helper method for payload access
  getUserId(): number {
    return this.getPayload().userId;
  }
}

// Usage
const userLoggedEvent = new LoginUserLoggedEvent(42);

console.log(userLoggedEvent.getType());   // "LOGIN_EVENTS/USER_LOGGED_IN"
console.log(userLoggedEvent.getUserId()); // 42

// Emit the event using EventManager
eventManager.emit(userLoggedEvent.getType(), userLoggedEvent);
```

#### AbstractWritableEvent

By convention, `AbstractEvent` payloads are read-only. When you need to allow event listeners to modify parts of your payload, use `AbstractWritableEvent`.

This class creates a writable copy of your payload that can be exposed through getters and setters:

**JavaScript**
```js
import { AbstractWritableEvent } from '@alliage/lifecycle';

const CHECKOUT_EVENTS = {
  COMPUTE_FINAL_PRICE: 'CHECKOUT_EVENTS/COMPUTE_FINAL_PRICE',
};

class CheckoutComputeFinalPriceEvent extends AbstractWritableEvent {
  constructor(price, vatNumber, countryCode) {
    super(
      CHECKOUT_EVENTS.COMPUTE_FINAL_PRICE, // Event type
      { price, vatNumber, countryCode }    // Event payload
    );
  }

  // Read-only properties use getPayload()
  getVatNumber() {
    return this.getPayload().vatNumber;
  }

  getCountryCode() {
    return this.getPayload().countryCode;
  }

  // Writable properties use getWritablePayload()
  getPrice() {
    return this.getWritablePayload().price;
  }

  // Setter method for modifying price
  setPrice(price) {
    this.getWritablePayload().price = price;
    return this;
  }
}

// Usage
const computeFinalPriceEvent = new CheckoutComputeFinalPriceEvent(42, 'FR01000000158', 'FR');

console.log(computeFinalPriceEvent.getPrice()); // 42
computeFinalPriceEvent.setPrice(38);
console.log(computeFinalPriceEvent.getPrice()); // 38
```

**TypeScript**
```ts
import { AbstractWritableEvent } from '@alliage/lifecycle';

const CHECKOUT_EVENTS = {
  COMPUTE_FINAL_PRICE: 'CHECKOUT_EVENTS/COMPUTE_FINAL_PRICE',
};

interface CheckoutComputeFinalPricePayload {
  price: number;
  vatNumber: string;
  countryCode: string;
}

class CheckoutComputeFinalPriceEvent extends AbstractWritableEvent<CheckoutComputeFinalPricePayload> {
  constructor(price: number, vatNumber: string, countryCode: string) {
    super(
      CHECKOUT_EVENTS.COMPUTE_FINAL_PRICE, // Event type
      { price, vatNumber, countryCode }    // Event payload
    );
  }

  // Read-only properties use getPayload()
  getVatNumber(): string {
    return this.getPayload().vatNumber;
  }

  getCountryCode(): string {
    return this.getPayload().countryCode;
  }

  // Writable properties use getWritablePayload()
  getPrice(): number {
    return this.getWritablePayload().price;
  }

  // Setter method for modifying price
  setPrice(price: number): this {
    this.getWritablePayload().price = price;
    return this;
  }
}

// Usage
const computeFinalPriceEvent = new CheckoutComputeFinalPriceEvent(42, 'FR01000000158', 'FR');

console.log(computeFinalPriceEvent.getPrice()); // 42
computeFinalPriceEvent.setPrice(38);
console.log(computeFinalPriceEvent.getPrice()); // 38
```

### Events

This module provides its own set of events triggered during different phases of the [Alliage script lifecycle](https://github.com/alliage-framework/framework#how-does-it-work-).

All event-related functionality is available in the `@alliage/lifecycle` module.

#### Types

##### Init

Init events are triggered before any other events:

**JavaScript**
```js
import { INIT_EVENTS } from '@alliage/lifecycle';

// Event listeners
eventManager.on(INIT_EVENTS.PRE_INIT, (event) => console.log('Pre init event', event));
eventManager.on(INIT_EVENTS.INIT, (event) => console.log('Init event', event));
eventManager.on(INIT_EVENTS.POST_INIT, (event) => console.log('Post init event', event));
```

**TypeScript**
```ts
import { INIT_EVENTS, LifeCycleInitEvent } from '@alliage/lifecycle';

// Event listeners
eventManager.on(INIT_EVENTS.PRE_INIT, (event: LifeCycleInitEvent) => console.log('Pre init event', event));
eventManager.on(INIT_EVENTS.INIT, (event: LifeCycleInitEvent) => console.log('Init event', event));
eventManager.on(INIT_EVENTS.POST_INIT, (event: LifeCycleInitEvent) => console.log('Post init event', event));
```

| Type                    | Event object                              | Description               |
| ----------------------- | ----------------------------------------- | ------------------------- |
| `INIT_EVENTS.PRE_INIT`  | [LifeCycleInitEvent](#lifecycleinitevent) | Before the initialization |
| `INIT_EVENTS.INIT`      | [LifeCycleInitEvent](#lifecycleinitevent) | Initialization            |
| `INIT_EVENTS.POST_INIT` | [LifeCycleInitEvent](#lifecycleinitevent) | After initialization      |

##### Install

Install events are triggered during the install script:

**JavaScript**
```js
import { INSTALL_EVENTS } from '@alliage/lifecycle';

// Event listeners
eventManager.on(INSTALL_EVENTS.PRE_INSTALL, (event) => console.log('Pre install event', event));
eventManager.on(INSTALL_EVENTS.INSTALL, (event) => console.log('Install event', event));
eventManager.on(INSTALL_EVENTS.POST_INSTALL, (event) => console.log('Post install event', event));
```

**TypeScript**
```ts
import { INSTALL_EVENTS, LifeCycleInstallEvent } from '@alliage/lifecycle';

// Event listeners
eventManager.on(INSTALL_EVENTS.PRE_INSTALL, (event: LifeCycleInstallEvent) => console.log('Pre install event', event));
eventManager.on(INSTALL_EVENTS.INSTALL, (event: LifeCycleInstallEvent) => console.log('Install event', event));
eventManager.on(INSTALL_EVENTS.POST_INSTALL, (event: LifeCycleInstallEvent) => console.log('Post install event', event));
```

| Type                          | Event object                                    | Description               |
| ----------------------------- | ----------------------------------------------- | ------------------------- |
| `INSTALL_EVENTS.PRE_INSTALL`  | [LifeCycleInstallEvent](#lifecycleinstallevent) | Before the install script |
| `INSTALL_EVENTS.INSTALL`      | [LifeCycleInstallEvent](#lifecycleinstallevent) | During install script     |
| `INSTALL_EVENTS.POST_INSTALL` | [LifeCycleInstallEvent](#lifecycleinstallevent) | After the install script  |

##### Build

Build events are triggered during the build script:

**JavaScript**
```js
import { BUILD_EVENTS } from '@alliage/lifecycle';

// Event listeners
eventManager.on(BUILD_EVENTS.PRE_BUILD, (event) => console.log('Pre build event', event));
eventManager.on(BUILD_EVENTS.BUILD, (event) => console.log('Build event', event));
eventManager.on(BUILD_EVENTS.POST_BUILD, (event) => console.log('Post build event', event));
```

**TypeScript**
```ts
import { BUILD_EVENTS, LifeCycleBuildEvent } from '@alliage/lifecycle';

// Event listeners
eventManager.on(BUILD_EVENTS.PRE_BUILD, (event: LifeCycleBuildEvent) => console.log('Pre build event', event));
eventManager.on(BUILD_EVENTS.BUILD, (event: LifeCycleBuildEvent) => console.log('Build event', event));
eventManager.on(BUILD_EVENTS.POST_BUILD, (event: LifeCycleBuildEvent) => console.log('Post build event', event));
```

| Type                      | Event object                                | Description         |
| ------------------------- | ------------------------------------------- | ------------------- |
| `BUILD_EVENTS.PRE_BUILD`  | [LifeCycleBuildEvent](#lifecyclebuildevent) | Before build script |
| `BUILD_EVENTS.BUILD`      | [LifeCycleBuildEvent](#lifecyclebuildevent) | During build script |
| `BUILD_EVENTS.POST_BUILD` | [LifeCycleBuildEvent](#lifecyclebuildevent) | After build script  |

##### Run

Run events are triggered during the run script:

**JavaScript**
```js
import { RUN_EVENTS } from '@alliage/lifecycle';

// Event listeners
eventManager.on(RUN_EVENTS.PRE_RUN, (event) => console.log('Pre run event', event));
eventManager.on(RUN_EVENTS.RUN, (event) => console.log('Run event', event));
eventManager.on(RUN_EVENTS.POST_RUN, (event) => console.log('Post run event', event));
```

**TypeScript**
```ts
import { RUN_EVENTS, LifeCycleRunEvent } from '@alliage/lifecycle';

// Event listeners
eventManager.on(RUN_EVENTS.PRE_RUN, (event: LifeCycleRunEvent) => console.log('Pre run event', event));
eventManager.on(RUN_EVENTS.RUN, (event: LifeCycleRunEvent) => console.log('Run event', event));
eventManager.on(RUN_EVENTS.POST_RUN, (event: LifeCycleRunEvent) => console.log('Post run event', event));
```

| Type                  | Event object                            | Description       |
| --------------------- | --------------------------------------- | ----------------- |
| `RUN_EVENTS.PRE_RUN`  | [LifeCycleRunEvent](#lifecyclerunevent) | Before run script |
| `RUN_EVENTS.RUN`      | [LifeCycleRunEvent](#lifecyclerunevent) | During run script |
| `RUN_EVENTS.POST_RUN` | [LifeCycleRunEvent](#lifecyclerunevent) | After run script  |

#### Classes

##### LifeCycleInitEvent

This is the event object received in any `INIT_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/alliage-framework/framework#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/alliage-framework/framework#environment)

##### LifeCycleInstallEvent

This is the event object received in any `INSTALL_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/alliage-framework/framework#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/alliage-framework/framework#environment)
- `getContext(): INITIALIZATION_CONTEXT`: Returns the initialization context (`INITIALIZATION_CONTEXT.INSTALL`, `INITIALIZATION_CONTEXT.BUILD`, or `INITIALIZATION_CONTEXT.RUN`)

##### LifeCycleBuildEvent

This is the event object received in any `BUILD_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/alliage-framework/framework#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/alliage-framework/framework#environment)

##### LifeCycleRunEvent

This is the event object received in any `RUN_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/alliage-framework/framework#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/alliage-framework/framework#environment)

### AbstractLifecycleAwareModule

The `AbstractLifecycleAwareModule` extends `AbstractModule` to simplify listening to lifecycle events and registering services.

You can use it instead of `AbstractModule` when creating your modules by implementing:

- `getEventHandlers()`: Returns event listeners mapped to event types
- `registerServices(serviceContainer: ServiceContainer, env: string)` _(optional)_: Registers services or sets parameters in the service container

**JavaScript**
```js
import { AbstractLifeCycleAwareModule, INIT_EVENTS, RUN_EVENTS } from '@alliage/lifecycle';
import { MyService } from './MyService.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  // Subscribe to events
  getEventHandlers() {
    return {
      [INIT_EVENTS.INIT]: this.handleInit,
      [RUN_EVENTS.RUN]: this.handleRun,
    };
  }

  // Register services
  registerServices(serviceContainer, env) {
    serviceContainer.registerService('my_service', MyService, []);
  }

  handleInit = (event) => {
    // Handle initialization
  };

  handleRun = (event) => {
    // Handle run
  };
}
```

**TypeScript**
```ts
import { AbstractLifeCycleAwareModule, INIT_EVENTS, RUN_EVENTS, LifeCycleInitEvent, LifeCycleRunEvent } from '@alliage/lifecycle';
import { ServiceContainer } from '@alliage/di';
import { MyService } from './MyService.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  // Subscribe to events
  getEventHandlers() {
    return {
      [INIT_EVENTS.INIT]: this.handleInit,
      [RUN_EVENTS.RUN]: this.handleRun,
    };
  }

  // Register services
  registerServices(serviceContainer: ServiceContainer, env: string): void {
    serviceContainer.registerService('my_service', MyService, []);
  }

  handleInit = (event: LifeCycleInitEvent): void => {
    // Handle initialization
  };

  handleRun = (event: LifeCycleRunEvent): void => {
    // Handle run
  };
}
```
