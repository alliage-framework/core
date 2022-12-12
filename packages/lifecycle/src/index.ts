import {
  AbstractModule,
  Arguments,
  PrimitiveContainer,
  INITIALIZATION_CONTEXT,
} from '@alliage/framework';

import { ServiceContainer } from '@alliage/di';

import {
  LifeCycleInitEvent,
  LifeCycleEventPayload,
  LifeCycleInstallEvent,
  LifeCycleBuildEvent,
  LifeCycleRunEvent,
} from './events';
import { EventManager } from './event-manager';

export default class LifecyleModule extends AbstractModule {
  private eventManager: EventManager;

  private serviceContainer!: ServiceContainer;

  public constructor() {
    super();
    this.eventManager = new EventManager();
  }

  public getKernelEventHandlers() {
    return {
      init: this.onInit,
      install: this.onInstall,
      build: this.onBuild,
      run: this.onRun,
    };
  }

  onInit = async (_args: Arguments, _env: string, container: PrimitiveContainer) => {
    this.serviceContainer = container.get<ServiceContainer>('service_container');
    this.serviceContainer.addService('event_manager', this.eventManager);
  };

  private async emitInitEvents(context: INITIALIZATION_CONTEXT, payload: LifeCycleEventPayload) {
    const eventParamsCreator = LifeCycleInitEvent.getParamsCreator({
      ...payload,
      context,
    });
    await this.eventManager.emit(...eventParamsCreator.createPreInit());
    await this.eventManager.emit(...eventParamsCreator.createInit());
    await this.eventManager.emit(...eventParamsCreator.createPostInit());
    this.serviceContainer.freeze();
  }

  private buildEventPayload(args: Arguments, env: string) {
    return {
      serviceContainer: this.serviceContainer,
      args,
      env,
    };
  }

  onInstall = async (args: Arguments, env: string) => {
    const payload = this.buildEventPayload(args, env);
    await this.emitInitEvents(INITIALIZATION_CONTEXT.INSTALL, payload);

    const eventParamsCreator = LifeCycleInstallEvent.getParamsCreator(payload);
    await this.eventManager.emit(...eventParamsCreator.createPreInstall());
    await this.eventManager.emit(...eventParamsCreator.createInstall());
    await this.eventManager.emit(...eventParamsCreator.createPostInstall());
  };

  onBuild = async (args: Arguments, env: string) => {
    const payload = this.buildEventPayload(args, env);
    await this.emitInitEvents(INITIALIZATION_CONTEXT.BUILD, payload);

    const eventParamsCreator = LifeCycleBuildEvent.getParamsCreator(payload);
    await this.eventManager.emit(...eventParamsCreator.createPreBuild());
    await this.eventManager.emit(...eventParamsCreator.createBuild());
    await this.eventManager.emit(...eventParamsCreator.createPostBuild());
  };

  onRun = async (args: Arguments, env: string) => {
    const payload = this.buildEventPayload(args, env);
    await this.emitInitEvents(INITIALIZATION_CONTEXT.RUN, payload);

    const eventParamsCreator = LifeCycleRunEvent.getParamsCreator(payload);
    await this.eventManager.emit(...eventParamsCreator.createPreRun());
    await this.eventManager.emit(...eventParamsCreator.createRun());
    await this.eventManager.emit(...eventParamsCreator.createPostRun());
  };
}

export * from './module';
export * from './event-manager';
export * from './events';
