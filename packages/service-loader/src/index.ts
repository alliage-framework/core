import path from 'path';
import { glob } from 'glob';

import { Dependency } from '@alliage/di';
import {
  LifeCycleInitEvent,
  INIT_EVENTS,
  AbstractLifeCycleAwareModule,
  EventManager,
} from '@alliage/lifecycle';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

import { CONFIG_NAME, schema, Config } from './config.js';
import { extractServiceDefinition } from './decorators/extractors/index.js';
import {
  ServiceLoaderBeforeAllEvent,
  ServiceLoaderAfterAllEvent,
  ServiceLoaderBeforeOneEvent,
  ServiceLoaderAfterOneEvent,
} from './events.js';
import { pathToFileURL } from 'url';

export default class ServiceLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validators.jsonSchema(schema)),
      [INIT_EVENTS.INIT]: this.handleInit,
    };
  }

  handleInit = async (event: LifeCycleInitEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const config = serviceContainer.getParameter<Config>(CONFIG_NAME);
    const servicesConfig = config;

    const beforeAllEvent = new ServiceLoaderBeforeAllEvent(
      servicesConfig.basePath,
      servicesConfig.paths,
      servicesConfig.exclude || [],
    );
    await eventManager.emit(beforeAllEvent.getType(), beforeAllEvent);

    const basePath = beforeAllEvent.getBasePath();
    const paths = beforeAllEvent.getPaths();
    const exclude = beforeAllEvent.getExclude();

    await Promise.all(
      paths.map(async (pattern) => {
        const files = await glob(pattern, {
          cwd: path.resolve(basePath),
          absolute: true,
          nodir: true,
          ignore: exclude as string[],
        });
        await Promise.all(
          files.map(async (file) => {
            const module = await import(pathToFileURL(file).href);
            const service = module.default ?? module;
            const definition = extractServiceDefinition(service);
            if (!definition) {
              return;
            }
            const beforeOneEvent = new ServiceLoaderBeforeOneEvent(
              file,
              definition.name,
              service,
              definition.dependencies,
            );
            await eventManager.emit(beforeOneEvent.getType(), beforeOneEvent);

            const name = beforeOneEvent.getName();
            const ctor = beforeOneEvent.getConstructor();
            const deps = beforeOneEvent.getDependencies();

            serviceContainer.registerService(name, ctor, deps as Dependency[]);

            await eventManager.emit(
              ...ServiceLoaderAfterOneEvent.getParams(file, name, ctor, deps),
            );
          }),
        );
      }),
    );

    await eventManager.emit(...ServiceLoaderAfterAllEvent.getParams(basePath, paths, exclude));
  };
}

export * from './config.js';
export * from './events.js';
export * from './decorators/index.js';
