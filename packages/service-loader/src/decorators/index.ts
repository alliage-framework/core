import { Constructor, Dependency } from '@alliage/di';

export const SERVICE_DEFINITION_PROPERTY_NAME = '@service-loader/decorators/SERVICE';

export interface ServiceDecoratorTarget {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  [SERVICE_DEFINITION_PROPERTY_NAME]?: {
    name: string;
    dependencies: Dependency[];
  };
}

export function Service<T extends Constructor>(name: string, dependencies: Dependency[] = []) {
  return (target: T): T => {
    return class extends target {
      static name = `${target.name}ServiceWrapper`;
      static [SERVICE_DEFINITION_PROPERTY_NAME] = {
        name,
        dependencies,
      };
    };
  };
}

export * from './extractors/index.js';
