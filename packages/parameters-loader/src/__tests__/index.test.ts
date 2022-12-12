import { validators, loadConfig, CONFIG_EVENTS } from '@alliage/config-loader';

import { schema, CONFIG_NAME } from '../config';
import ParametersLoaderModule from '..';

jest.mock('@alliage/config-loader');

describe('parameters-loader', () => {
  describe('ParametersLoaderModule', () => {
    const module = new ParametersLoaderModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD events', () => {
        const validateMockReturnValue = () => {};
        const loadConfigMockReturnValue = () => {};
        (validators.jsonSchema as jest.Mock).mockReturnValueOnce(validateMockReturnValue);
        (loadConfig as jest.Mock).mockReturnValueOnce(loadConfigMockReturnValue);

        expect(module.getEventHandlers()).toEqual({
          [CONFIG_EVENTS.LOAD]: loadConfigMockReturnValue,
        });

        expect(validators.jsonSchema).toHaveBeenCalledWith(schema);
        expect(loadConfig).toHaveBeenCalledWith(CONFIG_NAME, validateMockReturnValue);
      });
    });
  });
});
