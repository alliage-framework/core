import { Dependency } from '@alliage/di';

import { SERVICE_DEFINITION_PROPERTY_NAME } from '..';

export interface ServiceDefinition {
  name: string;
  dependencies: Dependency[];
}

export function extractServiceDefinition(target: any): ServiceDefinition | undefined {
  return target[SERVICE_DEFINITION_PROPERTY_NAME];
}
