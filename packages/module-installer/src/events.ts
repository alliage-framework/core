import { AbstractWritableEvent } from '@alliage/lifecycle';

import { Manifest } from './schemas/manifest';
import { JSONSchema } from 'json-schema-to-ts';

export enum INSTALLATION_EVENTS {
  PHASES_INIT = '@module-installer/EVENTS/BEFORE_COPY_ALL',

  PHASE_START = '@module-installer/EVENTS/PHASE_START',
  PHASE_END = '@module-installer/EVENTS/PHASE_END',

  SCHEMA_VALIDATION = '@module-installer/EVENTS/SCHEMA_VALIDATION',
}

export interface InstallationPhasesInitEventPayload {
  availablePhases: string[];
  defaultPhases: string[];
  env: string;
}

export class InstallationPhasesInitEvent extends AbstractWritableEvent<
  INSTALLATION_EVENTS,
  InstallationPhasesInitEventPayload
> {
  constructor(availablePhases: string[], defaultPhases: string[], env: string) {
    super(INSTALLATION_EVENTS.PHASES_INIT, { availablePhases, defaultPhases, env });
  }

  getAvailablePhases() {
    return Object.freeze(this.getWritablePayload().availablePhases);
  }

  getDefaultPhases() {
    return Object.freeze(this.getWritablePayload().defaultPhases);
  }

  getEnv() {
    return this.getPayload().env;
  }

  setAvailablePhases(availablePhases: string[]) {
    this.getWritablePayload().availablePhases = availablePhases;
    return this;
  }

  setDefaultPhases(defaultPhases: string[]) {
    this.getWritablePayload().defaultPhases = defaultPhases;
    return this;
  }
}

export interface InstallationPhaseEventPayload {
  moduleName: string;
  modulePath: string;
  packageInfo: Record<string, unknown>;
  manifest: Manifest;
  currentPhase: string;
  nextPhases: string[];
  env: string;
}

export class InstallationPhaseStartEvent extends AbstractWritableEvent<
  INSTALLATION_EVENTS,
  InstallationPhaseEventPayload
> {
  constructor(
    moduleName: string,
    modulePath: string,
    packageInfo: Record<string, unknown>,
    manifest: Manifest,
    currentPhase: string,
    nextPhases: string[],
    env: string,
  ) {
    super(INSTALLATION_EVENTS.PHASE_START, {
      moduleName,
      modulePath,
      packageInfo,
      manifest,
      currentPhase,
      nextPhases,
      env,
    });
  }

  getModuleName() {
    return this.getPayload().moduleName;
  }

  getModulePath() {
    return this.getPayload().modulePath;
  }

  getPackageInfo() {
    return Object.freeze(this.getPayload().packageInfo);
  }

  getManifest() {
    return Object.freeze(this.getWritablePayload().manifest);
  }

  getCurrentPhase() {
    return this.getWritablePayload().currentPhase;
  }

  getNextPhases() {
    return Object.freeze(this.getWritablePayload().nextPhases);
  }

  getEnv() {
    return this.getPayload().env;
  }

  setManifest(manifest: Manifest) {
    this.getWritablePayload().manifest = manifest;
    return this;
  }

  setCurrentPhase(currentPhase: string) {
    this.getWritablePayload().currentPhase = currentPhase;
    return this;
  }

  setNextPhases(nextPhases: string[]) {
    this.getWritablePayload().nextPhases = nextPhases;
    return this;
  }
}

export class InstallationPhaseEndEvent extends AbstractWritableEvent<
  INSTALLATION_EVENTS,
  InstallationPhaseEventPayload
> {
  constructor(
    moduleName: string,
    modulePath: string,
    packageInfo: Record<string, unknown>,
    manifest: Manifest,
    currentPhase: string,
    nextPhases: string[],
    env: string,
  ) {
    super(INSTALLATION_EVENTS.PHASE_END, {
      moduleName,
      modulePath,
      packageInfo,
      manifest,
      currentPhase,
      nextPhases,
      env,
    });
  }

  getModuleName() {
    return this.getPayload().moduleName;
  }

  getModulePath() {
    return this.getPayload().modulePath;
  }

  getPackageInfo() {
    return Object.freeze(this.getPayload().packageInfo);
  }

  getManifest() {
    return Object.freeze(this.getPayload().manifest);
  }

  getCurrentPhase() {
    return this.getPayload().currentPhase;
  }

  getNextPhases() {
    return Object.freeze(this.getPayload().nextPhases);
  }

  getEnv() {
    return this.getPayload().env;
  }

  static getParams(
    moduleName: string,
    modulePath: string,
    packageInfo: object,
    manifest: Manifest,
    currentPhase: string,
    nextPhases: string[],
    env: string,
  ) {
    return super.getParams(
      moduleName,
      modulePath,
      packageInfo,
      manifest,
      currentPhase,
      nextPhases,
      env,
    ) as [INSTALLATION_EVENTS.PHASE_END, InstallationPhaseEndEvent];
  }
}

export interface InstallationSchemaValidationEventPayload {
  moduleName: string;
  currentPhase: string;
  nextPhases: readonly string[];
  manifest: Manifest;
  extendedPropertiesSchemas: Record<string, JSONSchema>;
  env: string;
}

export class InstallationSchemaValidationEvent extends AbstractWritableEvent<
  INSTALLATION_EVENTS,
  InstallationSchemaValidationEventPayload
> {
  constructor(
    moduleName: string,
    currentPhase: string,
    nextPhases: readonly string[],
    manifest: Manifest,
    extendedPropertiesSchemas: Record<string, JSONSchema>,
    env: string,
  ) {
    super(INSTALLATION_EVENTS.SCHEMA_VALIDATION, {
      moduleName,
      currentPhase,
      nextPhases,
      manifest,
      extendedPropertiesSchemas,
      env,
    });
  }

  getModuleName() {
    return this.getPayload().moduleName;
  }

  getCurrentPhase() {
    return this.getPayload().currentPhase;
  }

  getNextPhases() {
    return Object.freeze(this.getPayload().nextPhases);
  }

  getManifest() {
    return Object.freeze(this.getPayload().manifest);
  }

  getExtendedPropertiesSchemas() {
    return Object.freeze(this.getWritablePayload().extendedPropertiesSchemas);
  }

  getEnv() {
    return this.getPayload().env;
  }

  setExtendedPropertiesSchema(extendedPropertiesSchemas: Record<string, JSONSchema>) {
    this.getWritablePayload().extendedPropertiesSchemas = extendedPropertiesSchemas;
    return this;
  }
}
