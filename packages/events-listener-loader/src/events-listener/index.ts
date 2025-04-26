import { AbstractEvent } from '@alliage/lifecycle';

export type EventHandlers = {
  [key: string]: (event: AbstractEvent<unknown>) => void | Promise<void>;
};

export abstract class AbstractEventsListener {
  getEventHandlers(): EventHandlers {
    return {};
  }
}
