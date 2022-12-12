import { AbstractModule, PrimitiveContainer, Arguments } from '@alliage/framework';

import { ServiceContainer } from './service-container';

export default class DependencyInjectionModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (_args: Arguments, env: string, container: PrimitiveContainer) => {
    const serviceContainer = new ServiceContainer();
    serviceContainer.addService('service_container', serviceContainer);
    serviceContainer.setParameter('environment', env);
    container.set('service_container', serviceContainer);
  };
}

export * from './dependencies';
export * from './service-container';
