import chalk from 'chalk';
import { Arguments, PrimitiveContainer } from '@alliage/framework';
import ErrorHandlerModule from '..';

describe('error-handler', () => {
  describe('ErrorHandlerModule', () => {
    const module = new ErrorHandlerModule();

    describe('#getKernelEventHandlers', () => {
      it('should listen to the init event', () => {
        expect(module.getKernelEventHandlers()).toEqual({
          init: module.handleInit,
        });
      });
    });

    describe('#handleInit', () => {
      class DummyError extends Error {
        public additionalProperty1 = 42;

        public additionalProperty2 = { foo: 'bar' };
      }

      let consoleErrorMock: jest.SpyInstance;

      beforeAll(async () => {
        await module.handleInit(
          Arguments.create(),
          'test',
          new PrimitiveContainer({ is_main_script: true }),
        );
      });

      beforeEach(() => {
        consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleErrorMock.mockRestore();
      });

      it('should display an error gracefully in case of unhandled exception', () => {
        process.emit('uncaughtException', new DummyError('A dummy error occured'));

        expect(consoleErrorMock).toBeCalledTimes(7);
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          1,
          chalk.white.bgRed(`${chalk.underline.bold('DummyError')}: A dummy error occured`),
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          2,
          chalk.blue.underline('additionalProperty1:'),
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(3, 42, '\n');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          4,
          chalk.blue.underline('additionalProperty2:'),
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          5,
          {
            foo: 'bar',
          },
          '\n',
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(6, chalk.blue.underline('stack trace:'));
        expect(consoleErrorMock).toHaveBeenNthCalledWith(7, expect.anything());
      });

      it('should display an error gracefully in case of unhandled rejection', () => {
        process.emit(
          'unhandledRejection',
          new DummyError('A dummy error occured'),
          Promise.resolve(),
        );

        expect(consoleErrorMock).toBeCalledTimes(7);
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          1,
          chalk.white.bgRed(`${chalk.underline.bold('DummyError')}: A dummy error occured`),
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          2,
          chalk.blue.underline('additionalProperty1:'),
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(3, 42, '\n');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          4,
          chalk.blue.underline('additionalProperty2:'),
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          5,
          {
            foo: 'bar',
          },
          '\n',
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(6, chalk.blue.underline('stack trace:'));
        expect(consoleErrorMock).toHaveBeenNthCalledWith(7, expect.anything());
      });

      it('should not display anything if the error is not an instance of "Error"', () => {
        process.emit('uncaughtException', ('error' as unknown) as Error);

        expect(consoleErrorMock).not.toHaveBeenCalled();
      });

      it('should display a generic name if the Error has no constructor', () => {
        const UnknownError = function(this: any, message: string) {
          return Error.call(this, message);
        };

        const error = new (UnknownError as any)('this error has no name');
        error.constructor = undefined;

        process.emit('uncaughtException', error);

        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          1,
          chalk.white.bgRed(`${chalk.underline.bold('Error')}: this error has no name`),
        );
      });

      it('should display a generic name if the Error has no name', () => {
        const UnknownError = function(this: any, message: string) {
          return Error.call(this, message);
        };

        const error = new (UnknownError as any)('this error has no name');

        process.emit('uncaughtException', error);

        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          1,
          chalk.white.bgRed(`${chalk.underline.bold('Error')}: this error has no name`),
        );
      });

      it('should display a generic message if the Error has no message', () => {
        process.emit('uncaughtException', new Error(''));

        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          1,
          chalk.white.bgRed(`${chalk.underline.bold('Error')}: An unknown error occured`),
        );
      });

      it('should not listen to errors if the script is a subscript', async () => {
        const onMock = jest.spyOn(process, 'on');
        const moduleInSubscript = new ErrorHandlerModule();

        await moduleInSubscript.handleInit(
          Arguments.create(),
          'test',
          new PrimitiveContainer({ is_main_script: false }),
        );

        expect(onMock).not.toHaveBeenCalled();

        onMock.mockRestore();
      });
    });
  });
});
