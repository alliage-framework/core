import { Dependency } from '@alliage/di';

export const SERVICE_DEFINITION_PROPERTY_NAME = '@service-loader/decorators/SERVICE';

export type ServiceDecoratorTarget = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  [SERVICE_DEFINITION_PROPERTY_NAME]?: {
    name: string;
    dependencies: Dependency[];
  };
};

export function Service(name: string, dependencies: Dependency[] = []) {
  return (target: ServiceDecoratorTarget) => {
    target[SERVICE_DEFINITION_PROPERTY_NAME] = {
      name,
      dependencies,
    };

    return target;
  };
}

export * from './extractors';
