import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { Manifest } from '../schemas/manifest.js';

export abstract class AbstractInstallationProcedure<Schema extends JSONSchema = JSONSchema> {
  abstract getName(): string;

  getParamsSchema(): Schema {
    return {} as Schema;
  }

  abstract proceed(manifest: Manifest<FromSchema<Schema>>, modulePath: string): void | Promise<void>;
}