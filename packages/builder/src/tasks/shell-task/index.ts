import { exec, ExecException } from 'child_process';
import { asConst, FromSchema } from 'json-schema-to-ts';

import { EventManager } from '@alliage/lifecycle';

import { AbstractTask } from '../abstract-task';
import { ShellTaskBeforeRunEvent, ShellTaskErrorEvent, ShellTaskSuccessEvent } from './events';

export const TASK_NAME = '@builder/tasks/SHELL_TASK';

export class CommandError extends Error {
  public stdout: string;

  public stderr: string;

  public error: ExecException;

  constructor(error: ExecException, stdout: string, stderr: string) {
    super(error.message);
    this.error = error;
    this.stderr = stderr;
    this.stdout = stdout;
  }
}

const paramsSchema = asConst({
  type: 'object',
  required: ['cmd'],
  additionalProperties: false,
  properties: {
    cmd: { type: 'string' },
  },
});
export class ShellTask extends AbstractTask<typeof paramsSchema> {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  getName() {
    return 'shell';
  }

  getParamsSchema() {
    return paramsSchema;
  }

  async run(params: FromSchema<typeof paramsSchema>): Promise<void> {
    const beforeRunEvent = new ShellTaskBeforeRunEvent(params.cmd);
    await this.eventManager.emit(beforeRunEvent.getType(), beforeRunEvent);
    const cmd = beforeRunEvent.getCommand();

    return new Promise((resolve, reject) => {
      exec(cmd, async (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          const exception = new CommandError(error, stdout, stderr);
          await this.eventManager.emit(...ShellTaskErrorEvent.getParams(cmd, exception));
          reject(exception);
        } else {
          await this.eventManager.emit(...ShellTaskSuccessEvent.getParams(cmd, stdout, stderr));
          resolve();
        }
      });
    });
  }
}
