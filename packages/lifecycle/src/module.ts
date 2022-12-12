import { AbstractModule, PrimitiveContainer, Arguments } from '@alliage/framework';
import { ServiceContainer } from '@alliage/di';

import { INIT_EVENTS, LifeCycleInitEvent } from './events';
import { EventManager } from './event-manager';

export type LifeCycleEventHandlers = {
  [event: string]: (...args: any[]) => void;
};

export abstract class AbstractLifeCycleAwareModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (_args: Arguments, env: string, container: PrimitiveContainer) => {
    const serviceContainer = container.get<ServiceContainer>('service_container');
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    eventManager.on(INIT_EVENTS.PRE_INIT, (event: LifeCycleInitEvent) => {
      this.registerServices(event.getServiceContainer(), env);
    });

    const eventHandlers = this.getEventHandlers();
    Object.entries(eventHandlers).forEach(([eventName, eventHandler]) => {
      if (eventHandler) {
        eventManager.on(eventName, eventHandler);
      }
    });
  };

  registerServices(_serviceContainer: ServiceContainer, _env: string) {}

  getEventHandlers(): LifeCycleEventHandlers {
    return {};
  }
}
