import { asConst, FromSchema } from 'json-schema-to-ts';

export const CONFIG_NAME = 'parameters';
export const schema = asConst({
  type: 'object',
  additionalProperties: true,
});

export type Config = FromSchema<typeof schema>;
