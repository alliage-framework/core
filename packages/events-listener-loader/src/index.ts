import {
  EventManager,
  AbstractLifeCycleAwareModule,
  INIT_EVENTS,
  LifeCycleInitEvent,
} from '@alliage/lifecycle';
import { Constructor } from '@alliage/di';

import { AbstractEventsListener } from './events-listener';

const UNAVAILABLE_EVENTS: string[] = [
  INIT_EVENTS.PRE_INIT,
  INIT_EVENTS.INIT,
  INIT_EVENTS.POST_INIT,
];

export default class EventsListernerLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [INIT_EVENTS.POST_INIT]: this.handlePostInit,
    };
  }

  handlePostInit = (event: LifeCycleInitEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const eventsListener = serviceContainer.getAllInstancesOf<AbstractEventsListener>(
      AbstractEventsListener as Constructor,
    );

    eventsListener.forEach((listener) => {
      Object.entries(listener.getEventHandlers()).forEach(([eventType, handler]) => {
        if (UNAVAILABLE_EVENTS.includes(eventType)) {
          throw new Error(
            `Events listener can't listen to events happening during the initialization phase`,
          );
        }
        eventManager.on(eventType, handler);
      });
    });
  };
}

export * from './events-listener';
