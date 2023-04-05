import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';

import {
  InstallScript,
  Arguments,
  ArgumentsParser,
  CommandBuilder,
  ModulesDefinition,
} from '@alliage/framework';
import { ServiceContainer, Constructor, service } from '@alliage/di';
import {
  AbstractLifeCycleAwareModule,
  INSTALL_EVENTS,
  LifeCycleInstallEvent,
  EventManager,
} from '@alliage/lifecycle';

import { validate, MODULE_TYPE } from './schemas/manifest';
import { FileCopyInstallationProcedure, PROCEDURE_NAME } from './installation-procedure/file-copy';
import { AbstractInstallationProcedure } from './installation-procedure';
import { INSTALLATION_PHASES } from './constants';
import {
  InstallationPhasesInitEvent,
  InstallationSchemaValidationEvent,
  InstallationPhaseStartEvent,
  InstallationPhaseEndEvent,
} from './events';

const LOCAL_MODULE_PATTERN = /^\.{0,2}(\/.*)+$/;
const MODULES_DEFINITION_PATH = './alliage-modules.json';

const DEFAULT_PHASES = [
  INSTALLATION_PHASES.DEPENDENCIES,
  INSTALLATION_PHASES.PROCEDURES,
  INSTALLATION_PHASES.REGISTRATION,
];

type ModulesDefinitionWithHash = ModulesDefinition & {
  [key: string]: {
    hash: string;
  };
};

export default class ModuleInstallerModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [INSTALL_EVENTS.INSTALL]: this.handleInstall,
    };
  }

  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService(PROCEDURE_NAME, FileCopyInstallationProcedure, [
      service('event_manager'),
    ]);
  }

  private runInstallationScript(
    moduleName: string,
    env: string,
    phases: INSTALLATION_PHASES[] = [],
  ) {
    const installScript = new InstallScript();
    return installScript.execute(
      Arguments.create(
        { script: 'install', env },
        phases.length > 0 ? [moduleName, phases.join(',')] : [moduleName],
        '',
        Arguments.create({}, ['install', moduleName]),
      ),
      env,
    );
  }

  handleInstall = async (event: LifeCycleInstallEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const phasesInitEvent = new InstallationPhasesInitEvent(
      DEFAULT_PHASES,
      DEFAULT_PHASES,
      event.getEnv(),
    );

    await eventManager.emit(phasesInitEvent.getType(), phasesInitEvent);

    const args = event.getArguments();

    const parsedArgs = ArgumentsParser.parse(
      CommandBuilder.create()
        .setDescription('Install a module')
        .addArgument('moduleName', {
          describe: 'The module to install',
          type: 'string',
        })
        .addArgument('phases', {
          describe: 'Installation phases to run',
          default: phasesInitEvent.getDefaultPhases().join(','),
          type: 'string',
        }),
      args,
    );

    const availablePhases = phasesInitEvent.getAvailablePhases();
    const phases = <INSTALLATION_PHASES[]>parsedArgs.get('phases').split(',');

    phases.forEach((phase) => {
      if (!availablePhases.includes(phase)) {
        throw new Error(
          `Unknown installation phase: "${phase}". Available phases: ${availablePhases.join(', ')}`,
        );
      }
    });

    let [currentPhase, ...nextPhases] = phases;

    let packageInfo;
    let moduleName: string;
    let modulePath: string;
    try {
      moduleName = parsedArgs.get('moduleName');
      const resolver = LOCAL_MODULE_PATTERN.test(moduleName) ? path.resolve : require.resolve;
      const packageJsonPath = resolver(`${moduleName}/package.json`).toString();
      modulePath = path.dirname(packageJsonPath);

      // eslint-disable-next-line import/no-dynamic-require, global-require
      packageInfo = require(packageJsonPath);
    } catch (e) {
      return;
    }

    const moduleHash = crypto
      .createHash('md5')
      .update(packageInfo.version)
      .digest('hex');

    // eslint-disable-next-line import/no-dynamic-require, global-require
    const modules: ModulesDefinitionWithHash = require(path.resolve(MODULES_DEFINITION_PATH));
    const moduleRegistration = modules[packageInfo.name];

    if (
      packageInfo.alliageManifest &&
      (!moduleRegistration || moduleRegistration.hash !== moduleHash)
    ) {
      const phaseStartEvent = new InstallationPhaseStartEvent(
        moduleName,
        modulePath,
        packageInfo,
        packageInfo.alliageManifest,
        currentPhase,
        nextPhases,
        event.getEnv(),
      );
      await eventManager.emit(phaseStartEvent.getType(), phaseStartEvent);
      const manifest = phaseStartEvent.getManifest();
      currentPhase = phaseStartEvent.getCurrentPhase() as INSTALLATION_PHASES;
      nextPhases = phaseStartEvent.getNextPhases() as INSTALLATION_PHASES[];

      let extendedPropertiesSchemas = {};
      const procedures = serviceContainer.getAllInstancesOf<AbstractInstallationProcedure>(
        AbstractInstallationProcedure as Constructor,
      );

      procedures.forEach((procedure: AbstractInstallationProcedure) => {
        extendedPropertiesSchemas = {
          ...extendedPropertiesSchemas,
          ...procedure.getSchema(),
        };
      });

      const schemaValidationEvent = new InstallationSchemaValidationEvent(
        moduleName,
        currentPhase,
        nextPhases,
        manifest,
        extendedPropertiesSchemas,
        event.getEnv(),
      );
      await eventManager.emit(schemaValidationEvent.getType(), schemaValidationEvent);

      validate(moduleName, manifest, schemaValidationEvent.getExtendedPropertiesSchemas());

      switch (currentPhase) {
        case INSTALLATION_PHASES.DEPENDENCIES:
          for (const dep of manifest.dependencies) {
            // eslint-disable-next-line no-await-in-loop
            await this.runInstallationScript(dep, event.getEnv());
          }
          break;
        case INSTALLATION_PHASES.PROCEDURES:
          if (manifest.installationProcedures) {
            await Promise.all(
              procedures.map((procedure) => procedure.proceed(manifest, modulePath)),
            );
          }
          break;
        case INSTALLATION_PHASES.REGISTRATION:
          if (manifest.type === MODULE_TYPE.MODULE) {
            modules[packageInfo.name] = {
              module: moduleName,
              deps: manifest.dependencies,
              envs: manifest.environments || [],
              hash: moduleHash,
            };
            await fs.writeFile(MODULES_DEFINITION_PATH, JSON.stringify(modules, null, 2));
          }
          break;

        // no default
      }

      await eventManager.emit(
        ...InstallationPhaseEndEvent.getParams(
          moduleName,
          modulePath,
          packageInfo,
          manifest,
          currentPhase,
          nextPhases,
          event.getEnv(),
        ),
      );

      if (nextPhases.length > 0) {
        await this.runInstallationScript(moduleName, event.getEnv(), nextPhases);
      }
    }
  };
}

export * from './events';
export * from './constants';
export * from './installation-procedure';
export * from './schemas';
