import Ajv from 'ajv';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
export abstract class AbstractTask<Schema extends JSONSchema = JSONSchema> {
  getParamsSchema(): Schema {
    return {} as Schema;
  }

  abstract getName(): string;

  abstract run(params: FromSchema<Schema>): void | Promise<void>;
}

export class TaskParamsValidationError extends Error {
  public errors: object[] | null | undefined;

  public taskName: string;

  constructor(taskName: string, errors: object[] | null | undefined) {
    super(`Invalid params for ${taskName} build task`);
    this.errors = errors;
    this.taskName = taskName;
  }
}

export class UnknownTaskError extends Error {
  constructor(taskName: string, availableTasks: string[]) {
    super(
      `Unknown build task "${taskName}". Available build tasks: ["${availableTasks.join('", "')}"]`,
    );
  }
}

export function validateParams(taskName: string, schema: JSONSchema, params: unknown) {
  const ajv = new Ajv({ allErrors: true, strictKeywords: true, logger: false });
  const res = ajv.validate(schema, params);
  if (!res) {
    throw new TaskParamsValidationError(taskName, ajv.errors);
  }
}
