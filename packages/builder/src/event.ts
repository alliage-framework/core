import { AbstractWritableEvent, AbstractEvent } from '@alliage/lifecycle';

import { Config } from './config.js';
import { AbstractTask } from './tasks/index.js';

export enum BUILDER_EVENTS {
  BEFORE_ALL_TASKS = '@builder/BUILDER_EVENTS/BEFORE_ALL_TASKS',
  AFTER_ALL_TASKS = '@builder/BUILDER_EVENTS/AFTER_ALL_TASKS',

  BEFORE_TASK = '@builder/BUILDER_EVENTS/BEFORE_TASK',
  AFTER_TASK = '@builder/BUILDER_EVENTS/AFTER_TASK',
}

export interface BuilderAllTasksEventPayload {
  config: Config;
  tasks: Record<string, AbstractTask>;
}

export class BuilderBeforeAllTasksEvent extends AbstractWritableEvent<
  BUILDER_EVENTS,
  BuilderAllTasksEventPayload
> {
  constructor(config: Config, tasks: { [name: string]: AbstractTask }) {
    super(BUILDER_EVENTS.BEFORE_ALL_TASKS, { config, tasks });
  }

  getConfig() {
    return Object.freeze(this.getWritablePayload().config);
  }

  getTasks() {
    return Object.freeze(this.getWritablePayload().tasks);
  }

  setConfig(config: Config) {
    this.getWritablePayload().config = config;
    return this;
  }
}

export class BuilderAfterAllTasksEvent extends AbstractEvent<
  BUILDER_EVENTS,
  BuilderAllTasksEventPayload
> {
  constructor(config: Config, tasks: { [name: string]: AbstractTask }) {
    super(BUILDER_EVENTS.AFTER_ALL_TASKS, { config, tasks });
  }

  getConfig() {
    return Object.freeze(this.getPayload().config);
  }

  getTasks() {
    return Object.freeze(this.getPayload().tasks);
  }

  static getParams(config: Config, tasks: { [name: string]: AbstractTask }) {
    return super.getParams(config, tasks) as [BUILDER_EVENTS.AFTER_ALL_TASKS, BuilderAfterAllTasksEvent];
  }
}

type TaskParams = string | number | boolean | null | undefined | TaskParams[] | { [key: string]: TaskParams };
export interface BuilderTaskEventPayload {
  task: AbstractTask;
  params: TaskParams;
  description: string;
}

export class BuilderBeforeTaskEvent extends AbstractWritableEvent<
  BUILDER_EVENTS,
  BuilderTaskEventPayload
> {
  constructor(task: AbstractTask, params: TaskParams, description: string) {
    super(BUILDER_EVENTS.BEFORE_TASK, { task, params, description });
  }

  getTask() {
    return this.getWritablePayload().task;
  }

  getParams() {
    return Object.freeze(this.getWritablePayload().params);
  }

  getDescription() {
    return this.getWritablePayload().description;
  }

  setParams(params: TaskParams) {
    this.getWritablePayload().params = params;
    return this;
  }

  setDescription(description: string) {
    this.getWritablePayload().description = description;
    return this;
  }
}

export class BuilderAfterTaskEvent extends AbstractEvent<BUILDER_EVENTS, BuilderTaskEventPayload> {
  constructor(task: AbstractTask, params: TaskParams, description: string) {
    super(BUILDER_EVENTS.AFTER_TASK, { task, params, description });
  }

  getTask() {
    return this.getPayload().task;
  }

  getParams() {
    return Object.freeze(this.getPayload()).params;
  }

  getDescription() {
    return this.getPayload().description;
  }

  static getParams(task: AbstractTask, params: Readonly<TaskParams>, description: string) {
    return super.getParams(task, params, description) as [BUILDER_EVENTS.AFTER_TASK, BuilderAfterTaskEvent];
  }
}
