import path from 'path';
import { glob } from 'glob';
import * as fse from 'fs-extra';
import { asConst, FromSchema } from 'json-schema-to-ts';

import { EventManager } from '@alliage/lifecycle';

import { AbstractInstallationProcedure } from '../index.js';
import { Manifest } from '../../schemas/manifest.js';
import {
  FileCopyBeforeCopyAllEvent,
  FileCopyAfterCopyAllEvent,
  FileCopyBeforeCopyFileEvent,
  FileCopyAfterCopyFileEvent,
} from './events.js';

export const PROCEDURE_NAME = '@module-installer/INSTALLATION_PROCEDURE/FILE_COPY';

const schema = asConst({
  type: 'array',
  items: {
    type: 'array',
    items: [
      {
        type: 'string',
        description: 'Source',
      },
      {
        type: 'string',
        description: 'Destination',
      },
    ],
    minItems: 2,
    maxItems: 2,
    additionalItems: false
  },
});

export class FileCopyInstallationProcedure extends AbstractInstallationProcedure {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  getName() {
    return 'copyFiles';
  }

  getParamsSchema() {
    return schema;
  }

  async proceed(manifest: Manifest<{ copyFiles: FromSchema<typeof schema> }>, modulePath: string) {
    const filesToCopy = manifest.installationProcedures.copyFiles;
    if (filesToCopy) {
      const copiedFiles: [string, string][] = [];
      const beforeCopyAllEvent = new FileCopyBeforeCopyAllEvent(modulePath, filesToCopy);
      await this.eventManager.emit(beforeCopyAllEvent.getType(), beforeCopyAllEvent);
      const computedModulePath = beforeCopyAllEvent.getModulePath();
      await Promise.all(
        beforeCopyAllEvent.getFilesToCopy().map(async ([source, destination]) => {
          const files = await glob(`${computedModulePath}/${source}`);
          await Promise.all(
            files.map(async (sourceFile) => {
              const absoluteDestination = path.resolve(destination);
              if (!(await fse.pathExists(absoluteDestination))) {
                const beforeCopyFileEvent = new FileCopyBeforeCopyFileEvent(
                  computedModulePath,
                  sourceFile,
                  absoluteDestination,
                );
                await this.eventManager.emit(beforeCopyFileEvent.getType(), beforeCopyFileEvent);
                const computedSourceFile = beforeCopyFileEvent.getSourceFile();
                const computedDestination = beforeCopyFileEvent.getDestination();

                await fse.copy(computedSourceFile, computedDestination);

                process.stdout.write(`Copy ${sourceFile} -> ${destination}\n`);
                copiedFiles.push([computedSourceFile, computedDestination]);

                await this.eventManager.emit(
                  ...FileCopyAfterCopyFileEvent.getParams(
                    computedModulePath,
                    computedSourceFile,
                    computedDestination,
                  ),
                );
              }
            }),
          );
        }),
      );
      await this.eventManager.emit(
        ...FileCopyAfterCopyAllEvent.getParams(computedModulePath, copiedFiles),
      );
    }
  }
}

export * from './events.js';
