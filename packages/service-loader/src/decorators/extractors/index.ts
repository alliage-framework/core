import { Dependency } from '@alliage/di';

import { SERVICE_DEFINITION_PROPERTY_NAME, ServiceDecoratorTarget } from '../index.js';

export interface ServiceDefinition {
  name: string;
  dependencies: Dependency[];
}

export function extractServiceDefinition(target: ServiceDecoratorTarget): ServiceDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(target, SERVICE_DEFINITION_PROPERTY_NAME)
    ? target[SERVICE_DEFINITION_PROPERTY_NAME]
    : undefined;
}
