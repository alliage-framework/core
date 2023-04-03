import fs from 'fs';
import { createHash } from 'crypto';
import { Sandbox } from '@alliage/sandbox';

const HASH = createHash('md5')
  .update(require('../../lerna.json').version)
  .digest('hex');

describe('Main scenario', () => {
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  beforeAll(async () => {
    await sandbox.init();
  });

  afterAll(async () => {
    await sandbox.clear();
  });

  it('should install correctly all the modules by updating the alliage-modules.json and copying the configuration files', async () => {
    const { waitCompletion } = sandbox.install(['@alliage/core', '--env=development']);

    await waitCompletion();

    const builderConfigFile = `${sandbox.getPath()}/config/builder.yaml`;
    expect(fs.existsSync(builderConfigFile)).toBe(true);
    expect(fs.readFileSync(builderConfigFile).toString()).toMatchSnapshot();

    const servicesConfigFile = `${sandbox.getPath()}/config/services.yaml`;
    expect(fs.existsSync(servicesConfigFile)).toBe(true);
    expect(fs.readFileSync(servicesConfigFile).toString()).toMatchSnapshot();

    expect(
      JSON.parse(fs.readFileSync(`${sandbox.getPath()}/alliage-modules.json`).toString()),
    ).toEqual({
      '@alliage/lifecycle': {
        module: '@alliage/lifecycle',
        deps: ['@alliage/di'],
        envs: [],
        hash: HASH,
      },
      '@alliage/module-installer': {
        module: '@alliage/module-installer',
        deps: ['@alliage/di', '@alliage/lifecycle'],
        envs: ['development'],
        hash: HASH,
      },
      '@alliage/di': {
        module: '@alliage/di',
        deps: [],
        envs: [],
        hash: HASH,
      },
      '@alliage/config-loader': {
        module: '@alliage/config-loader',
        deps: ['@alliage/di', '@alliage/lifecycle'],
        envs: [],
        hash: HASH,
      },
      '@alliage/builder': {
        module: '@alliage/builder',
        deps: [
          '@alliage/config-loader',
          '@alliage/di',
          '@alliage/lifecycle',
          '@alliage/module-installer',
        ],
        envs: ['development'],
        hash: HASH,
      },
      '@alliage/service-loader': {
        module: '@alliage/service-loader',
        deps: [
          '@alliage/config-loader',
          '@alliage/di',
          '@alliage/lifecycle',
          '@alliage/module-installer',
        ],
        envs: [],
        hash: HASH,
      },
      '@alliage/parameters-loader': {
        module: '@alliage/parameters-loader',
        deps: [
          '@alliage/config-loader',
          '@alliage/di',
          '@alliage/lifecycle',
          '@alliage/module-installer',
        ],
        envs: [],
        hash: HASH,
      },
      '@alliage/process-manager': {
        module: '@alliage/process-manager',
        deps: [
          '@alliage/config-loader',
          '@alliage/di',
          '@alliage/lifecycle',
          '@alliage/service-loader',
        ],
        envs: [],
        hash: HASH,
      },
      '@alliage/events-listener-loader': {
        deps: ['@alliage/di', '@alliage/lifecycle', '@alliage/service-loader'],
        module: '@alliage/events-listener-loader',
        envs: [],
        hash: HASH,
      },
      '@alliage/error-handler': {
        deps: [],
        envs: [],
        hash: HASH,
        module: '@alliage/error-handler',
      },
    });
  });

  it('should execute the DummyProcess', async () => {
    const { waitCompletion, process: childProcess } = sandbox.run(['dummy-process', 'test']);

    let output = '';
    childProcess.stdout!.on('data', (chunk) => {
      output += chunk;
    });
    await waitCompletion();
    expect(output).toEqual(
      'Test pre execute\nHello Alliage Core ! - test - production\nabout to shut down...\nTest pre terminate\nshutting down with signal: @process-manager/SIGNAL/SUCCESS_SHUTDOWN\n',
    );
  });

  it('should display errors gracefully', async () => {
    const { waitCompletion, process: childProcess } = sandbox.run(['error-process']);

    let output = '';
    childProcess.stderr!.on('data', (chunk) => {
      output += chunk;
    });
    await waitCompletion();

    expect(output).toMatch(
      /^DummyError: A dummy error occured\nprop1:\ntest_prop1 \n\nprop2:\n\[ 'test_prop2-1', 'test_prop2-2' \] \n\nstack trace:\n.*$/gm,
    );
  });

  it('should execute the shell builder according to the configutation', async () => {
    fs.writeFileSync(
      `${sandbox.getPath()}/config/builder.yaml`,
      `
tasks:
  -
    name: shell
    description: Test builder
    params:
      cmd: 'echo "This is a test" > test-builder.txt'
`,
    );

    const { waitCompletion, process: childProcess } = sandbox.build(['--env=development']);

    let output = '';
    childProcess.stdout!.on('data', (chunk) => {
      output += chunk;
    });
    await waitCompletion();
    expect(output).toEqual('Running task: Test builder...\n');

    const testBuilderFile = `${sandbox.getPath()}/test-builder.txt`;
    expect(fs.existsSync(testBuilderFile)).toBe(true);
    expect(fs.readFileSync(testBuilderFile).toString()).toEqual('This is a test\n');
  });
});
