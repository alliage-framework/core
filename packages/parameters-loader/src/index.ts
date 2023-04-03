import { AbstractLifeCycleAwareModule } from '@alliage/lifecycle';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

import { CONFIG_NAME, schema } from './config';

export default class ParametersLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validators.jsonSchema(schema)),
    };
  }
}

export * from './config';
