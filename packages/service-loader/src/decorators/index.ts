import { Dependency } from '@alliage/di';

export const SERVICE_DEFINITION_PROPERTY_NAME = '@service-loader/decorators/SERVICE';

export function Service(name: string, dependencies: Dependency[] = []) {
  return (target: any) => {
    // eslint-disable-next-line no-param-reassign
    target[SERVICE_DEFINITION_PROPERTY_NAME] = {
      name,
      dependencies,
    };

    return target;
  };
}

export * from './extractors';
