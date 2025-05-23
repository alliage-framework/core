import { validators, loadConfig, CONFIG_EVENTS } from '@alliage/config-loader';
import { describe, it, expect, vi, MockInstance } from 'vitest';

import { schema, CONFIG_NAME } from '../config';
import ParametersLoaderModule from '..';

vi.mock('@alliage/config-loader');

describe('parameters-loader', () => {
  describe('ParametersLoaderModule', () => {
    const module = new ParametersLoaderModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD events', () => {
        const validateMockReturnValue = () => {};
        const loadConfigMockReturnValue = () => {};
        (validators.jsonSchema as unknown as MockInstance).mockReturnValueOnce(validateMockReturnValue);
        (loadConfig as unknown as MockInstance).mockReturnValueOnce(loadConfigMockReturnValue);

        expect(module.getEventHandlers()).toEqual({
          [CONFIG_EVENTS.LOAD]: loadConfigMockReturnValue,
        });

        expect(validators.jsonSchema).toHaveBeenCalledWith(schema);
        expect(loadConfig).toHaveBeenCalledWith(CONFIG_NAME, validateMockReturnValue);
      });
    });
  });
}); 