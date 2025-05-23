import { glob } from 'glob';
import { copy, pathExists } from 'fs-extra';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';

import { EventManager } from '@alliage/lifecycle';

import { FileCopyInstallationProcedure } from '..';
import { MODULE_TYPE } from '../../../schemas/manifest';
import {
  FILE_COPY_EVENTS,
  FileCopyBeforeCopyAllEvent,
  FileCopyBeforeCopyFileEvent,
  FileCopyAfterCopyFileEvent,
  FileCopyAfterCopyAllEvent,
} from '../events';

vi.mock('glob', () => {
  return {
    glob: vi.fn(),
  };
});

vi.mock(import('fs-extra'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    copy: vi.fn(),
    pathExists: vi.fn(),
  };
});

describe('module-installer/installation-procedures/file-copy', () => {
  describe('FileCopyInstallationProcedure', () => {
    const eventManager = new EventManager();
    const procedure = new FileCopyInstallationProcedure(eventManager);

    describe('#getName', () => {
      it('should return the name of the procedure', () => {
        expect(procedure.getName()).toEqual('copyFiles');
      });
    });

    describe('#getSchema', () => {
      it("should return the JSON Schema of it's configuration in the manifest", () => {
        expect(procedure.getParamsSchema()).toEqual({
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
            additionalItems: false,
          },
        });
      });
    });

    describe('#proceed', () => {
      let globMock: MockInstance;
      let copyMock: MockInstance;
      let pathExistsMock: MockInstance;

      const manifest = {
        type: MODULE_TYPE.MODULE,
        dependencies: [],
        installationProcedures: {
          copyFiles: [
            ['path/to/file1*', 'destination1'],
            ['path/to/file2*', 'destination2'],
          ] as [string, string][],
        },
      };

      const beforeCopyAllEventHandler = vi.fn();
      const afterCopyAllEventHandler = vi.fn();
      const beforeCopyFileEventHandler = vi.fn();
      const afterCopyFileEventHandler = vi.fn();

      eventManager.on(FILE_COPY_EVENTS.BEFORE_COPY_ALL, beforeCopyAllEventHandler);
      eventManager.on(FILE_COPY_EVENTS.AFTER_COPY_ALL, afterCopyAllEventHandler);
      eventManager.on(FILE_COPY_EVENTS.BEFORE_COPY_FILE, beforeCopyFileEventHandler);
      eventManager.on(FILE_COPY_EVENTS.AFTER_COPY_FILE, afterCopyFileEventHandler);

      beforeEach(() => {
        globMock = glob as unknown as MockInstance;
        globMock
          .mockResolvedValueOnce([
            '/path/to/module/path/to/file11',
            '/path/to/module/path/to/file12',
          ])
          .mockResolvedValueOnce([
            '/path/to/module/path/to/file21',
            '/path/to/module/path/to/file22',
          ]);

        copyMock = (copy as unknown as MockInstance).mockResolvedValue(undefined as never);
        pathExistsMock = (pathExists as unknown as MockInstance).mockResolvedValue(false as never);
      });

      afterEach(() => {
        vi.resetAllMocks();
      });

      it('should proceed to file copy according to the manifest configuration and trigger all the events', async () => {
        // Test events
        beforeCopyAllEventHandler.mockImplementationOnce((event: FileCopyBeforeCopyAllEvent) => {
          expect(event.getModulePath()).toEqual('/path/to/module');
          expect(event.getFilesToCopy()).toEqual([
            ['path/to/file1*', 'destination1'],
            ['path/to/file2*', 'destination2'],
          ]);

          event.setFilesToCopy([
            ['transformed/path/to/file1*', 'transformed/destination1'],
            ['transformed/path/to/file2*', 'transformed/destination2'],
          ]);
          event.setModulePath('/transformed/path/to/module');
        });
        beforeCopyFileEventHandler
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file11');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination1'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file11');
            event.setDestination('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file12');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination1'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file12');
            event.setDestination('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file21');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination2'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file21');
            event.setDestination('/re/transformed/destination2');
          })
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file22');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination2'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file22');
            event.setDestination('/re/transformed/destination2');
          });
        afterCopyFileEventHandler
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file11',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file12',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file21',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination2');
          })
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file22',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination2');
          });
        afterCopyAllEventHandler.mockImplementationOnce((event: FileCopyAfterCopyAllEvent) => {
          expect(event.getModulePath()).toEqual('/transformed/path/to/module');
          expect(event.getCopiedFiles()).toEqual([
            [
              '/re/transformed/path/to/module/transformed/path/to/file11',
              '/re/transformed/destination1',
            ],
            [
              '/re/transformed/path/to/module/transformed/path/to/file12',
              '/re/transformed/destination1',
            ],
            [
              '/re/transformed/path/to/module/transformed/path/to/file21',
              '/re/transformed/destination2',
            ],
            [
              '/re/transformed/path/to/module/transformed/path/to/file22',
              '/re/transformed/destination2',
            ],
          ]);
        });

        // Runs procedure
        await procedure.proceed(manifest, '/path/to/module');

        expect(globMock).toHaveBeenNthCalledWith(
          1,
          '/transformed/path/to/module/transformed/path/to/file1*',
        );
        expect(globMock).toHaveBeenNthCalledWith(
          2,
          '/transformed/path/to/module/transformed/path/to/file2*',
        );

        expect(copyMock).toHaveBeenNthCalledWith(
          1,
          '/re/transformed/path/to/module/transformed/path/to/file11',
          '/re/transformed/destination1',
        );
        expect(copyMock).toHaveBeenNthCalledWith(
          2,
          '/re/transformed/path/to/module/transformed/path/to/file12',
          '/re/transformed/destination1',
        );
        expect(copyMock).toHaveBeenNthCalledWith(
          3,
          '/re/transformed/path/to/module/transformed/path/to/file21',
          '/re/transformed/destination2',
        );
        expect(copyMock).toHaveBeenNthCalledWith(
          4,
          '/re/transformed/path/to/module/transformed/path/to/file22',
          '/re/transformed/destination2',
        );

        expect(beforeCopyAllEventHandler).toHaveBeenCalledTimes(1);
        expect(beforeCopyFileEventHandler).toHaveBeenCalledTimes(4);
        expect(afterCopyFileEventHandler).toHaveBeenCalledTimes(4);
        expect(afterCopyAllEventHandler).toHaveBeenCalledTimes(1);
      });

      it('should throw an error if the glob fails', async () => {
        const error = new Error();
        globMock.mockReset();
        globMock.mockRejectedValueOnce(error);

        let thrownError: Error | undefined;
        try {
          await procedure.proceed(manifest, '/path/to/module');
        } catch (e) {
          thrownError = e as Error;
        }

        expect(thrownError).toBe(error);
      });

      it("should not do anything if there's no configuration for the procedure in the manifest", async () => {
        const manifestWithoutCopyFiles = {
          ...manifest,
          installationProcedures: {},
        };
        await procedure.proceed(manifestWithoutCopyFiles as any, '/path/to/module');

        expect(globMock).not.toHaveBeenCalled();
        expect(pathExistsMock).not.toHaveBeenCalled();
        expect(copyMock).not.toHaveBeenCalled();
        expect(beforeCopyAllEventHandler).not.toHaveBeenCalled();
        expect(beforeCopyFileEventHandler).not.toHaveBeenCalled();
        expect(afterCopyFileEventHandler).not.toHaveBeenCalled();
        expect(afterCopyAllEventHandler).not.toHaveBeenCalled();
      });

      it('should not do the copy and trigger the related events if the destination already exits', async () => {
        pathExistsMock
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(false);

        await procedure.proceed(manifest, '/path/to/module');

        expect(globMock).toHaveBeenCalledTimes(2);
        expect(globMock).toHaveBeenNthCalledWith(1, '/path/to/module/path/to/file1*');
        expect(globMock).toHaveBeenNthCalledWith(2, '/path/to/module/path/to/file2*');

        expect(pathExistsMock).toHaveBeenCalledTimes(4);

        expect(copyMock).toHaveBeenCalledTimes(2);
        expect(copyMock).toHaveBeenNthCalledWith(
          1,
          '/path/to/module/path/to/file12',
          path.resolve('destination1'),
        );
        expect(copyMock).toHaveBeenNthCalledWith(
          2,
          '/path/to/module/path/to/file22',
          path.resolve('destination2'),
        );

        expect(beforeCopyAllEventHandler).toHaveBeenCalledTimes(1);
        expect(beforeCopyFileEventHandler).toHaveBeenCalledTimes(2);
        expect(afterCopyFileEventHandler).toHaveBeenCalledTimes(2);
        expect(afterCopyAllEventHandler).toHaveBeenCalledTimes(1);
      });
    });
  });
});
