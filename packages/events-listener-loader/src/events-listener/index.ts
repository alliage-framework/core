export type EventHandlers = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (event: any) => void | Promise<void>;
};

export abstract class AbstractEventsListener {
  getEventHandlers(): EventHandlers {
    return {};
  }
}
