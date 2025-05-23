import { Ajv } from 'ajv';
import { asConst, FromSchema, JSONSchema } from 'json-schema-to-ts';

import { ManifestValidationError } from './index.js';

export enum MODULE_TYPE {
  COMPOUND = 'compound',
  MODULE = 'module',
}

export const schema = asConst({
  type: 'object',
  required: ['type', 'dependencies'],
  additionalProperties: false,
  properties: {
    type: {
      type: 'string',
      enum: [MODULE_TYPE.MODULE, MODULE_TYPE.COMPOUND],
    },
    dependencies: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    environments: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
});

export type Manifest<T = { [key: string]: FromSchema<JSONSchema> }> = FromSchema<typeof schema> & {
  installationProcedures: T;
};

export function validate(
  moduleName: string,
  manifest: object,
  installationProceduresSchema: Record<string, JSONSchema> = {},
) {
  const ajv = new Ajv({ allErrors: true, strictSchema: true, logger: false });
  const res = ajv.validate(
    {
      ...schema,
      properties: {
        ...schema.properties,
        installationProcedures: {
          type: 'object',
          additionalProperties: false,
          properties: installationProceduresSchema,
        },
      },
    },
    manifest,
  );
  if (!res) {
    throw new ManifestValidationError(moduleName, ajv.errors);
  }
}
