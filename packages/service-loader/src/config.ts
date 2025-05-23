import { asConst, FromSchema } from 'json-schema-to-ts';

export const CONFIG_NAME = 'services';
export const schema = asConst({
  type: 'object',
  additionalProperties: false,
  required: ['basePath', 'paths'],
  properties: {
    basePath: {
      type: 'string',
    },
    paths: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    exclude: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
});

export type Config = FromSchema<typeof schema>;
