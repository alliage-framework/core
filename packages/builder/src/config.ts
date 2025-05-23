import { asConst, FromSchema } from 'json-schema-to-ts';

export const CONFIG_NAME = 'builder';
export const schema = asConst({
  type: 'object',
  additionalProperties: false,
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'params'],
        properties: {
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          params: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
  },
});

export type Config = FromSchema<typeof schema>;