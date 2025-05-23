# Alliage Module Installer

The Module Installer automates common actions required when installing an Alliage module, including:

- Registering modules in the `alliage-modules.json` file
- Installing module dependencies
- Creating or copying configuration files
- And more...

## Dependencies

- [@alliage/lifecycle](../lifecycle)

## Installation

```bash
yarn add -D @alliage/module-installer
```

Or with npm:

```bash
npm install --save-dev @alliage/module-installer
```

## Registration

Add the module to your `alliage-modules.json` file:

```json
{
  // ... other modules
  "@alliage/module-installer": {
    "module": "@alliage/module-installer",
    "deps": [
      "@alliage/lifecycle"
    ],
    "envs": ["development"]
  }
}
```

## Usage

After installing an Alliage module package with npm or yarn, you can install it in your Alliage project by running:

```bash
$(npm bin)/alliage-scripts install [package name]
```

### Manifest

For a package to be recognized as an Alliage module (and therefore installable), its `package.json` must contain a manifest under the `alliageManifest` property.

This manifest contains metadata necessary for automatic installation:

```json
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    "type": "module",
    "dependencies": [
      "other-alliage-module",
      "another-alliage-module"
    ],
    "environments": ["development"],
    "installationProcedures": {
      // ...
    }
  }
}
```

#### Manifest Properties

- **type** (`string`): The module type:
  - `"module"`: A standard Alliage module
  - `"compound"`: An aggregation of multiple modules that won't be registered in `alliage-modules.json`
- **dependencies** (`string[]`): Other modules this module depends on
- **environments** (`string[]`): Environments in which this module will be loaded (leave empty for all environments)
- **installationProcedures** (`object`): Procedures to run during installation (see [Procedures Phase](#procedures-phase))

### Installation Flow

The installation script executes several phases and reloads the kernel between phases to apply changes:

#### Dependencies Phase

The dependencies phase installs each dependency listed in the module's manifest. This ensures that all required modules are properly installed before the module itself.

#### Procedures Phase

The procedures phase executes installation procedures as specified in the manifest. Procedures can include actions like [copying files](#file-copy-procedure) or any other setup needed for the module to function correctly.

#### Registration Phase

The registration phase automatically adds the module to the `alliage-modules.json` file of the project.

### Installation Procedures

Installation procedures are tasks required to make your module usable. These can include:

- Calling a remote API
- Running shell commands
- [Copying files](#file-copy-procedure)
- Any other action not directly related to Alliage's internal functioning

Procedures are defined in the `installationProcedures` property of the manifest:

```json
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    // ...
    "installationProcedures": {
      "[procedure name]": {
        // [procedure parameters]
      }
    }
  }
}
```

This module includes one [built-in procedure](#file-copy-procedure) and provides tools to create custom installation procedures.

### Running Specific Phases

You can run specific installation phases instead of the full process:

```bash
$(npm bin)/alliage-scripts install [package name] --phases=procedures
```

This command will only run the "procedures" phase.

You can also run multiple phases in a specific order:

```bash
$(npm bin)/alliage-scripts install [package name] --phases=procedures,registration
```

This will run the "procedures" phase followed by the "registration" phase.

#### Creating Custom Installation Procedures

You can create custom installation procedures by implementing the `AbstractInstallationProcedure` class:

**TypeScript Example:**
```typescript
import { execSync } from 'child_process';
import { AbstractInstallationProcedure, Manifest } from '@alliage/module-installer';
import { JSONSchema } from 'json-schema-to-ts';

// We expect a "commands" property in the manifest
// with an array of strings as its value
const schema = {
  commands: {
    type: 'array',
    items: {
      type: 'string'
    }
  }
} as const

export class ShellProcedure extends AbstractInstallationProcedure {
  getName() {
    return 'shell_procedure';
  }

  getParamsSchema() {
    return schema;
  }

  proceed(manifest: Manifest<{ commands: typeof schema }>): void {
    const { commands } = manifest.installationProcedures;
    if (commands) {
      // Execute each command in the array
      commands.forEach((command: string) => {
        execSync(command);
      });
    }
  }
}
```

**JavaScript Example:**
```javascript
import { execSync } from 'child_process';
import { AbstractInstallationProcedure } from '@alliage/module-installer';

export class ShellProcedure extends AbstractInstallationProcedure {
  getName() {
    return 'shell_procedure';
  }

  getParamsSchema() {
    // We expect a "commands" property in the manifest
    // with an array of strings as its value
    return {
      commands: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    };
  }

  proceed(manifest, _modulePath) {
    const { commands } = manifest.installationProcedures;
    if (commands) {
      // Execute each command in the array
      commands.forEach(command => {
        execSync(command);
      });
    }
  }
}
```

After creating your procedure, register it as a service in your module:

**TypeScript Example:**
```typescript
import { AbstractLifeCycleAwareModule, INIT_EVENTS, RUN_EVENTS } from '@alliage/lifecycle';
import { ServiceContainer } from '@alliage/di';
import { ShellProcedure } from './shell-procedure.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    // ...
  }

  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService('shell_procedure', ShellProcedure, []);
  }
}
```

**JavaScript Example:**
```javascript
import { AbstractLifeCycleAwareModule, INIT_EVENTS, RUN_EVENTS } from '@alliage/lifecycle';
import { ShellProcedure } from './shell-procedure.js';

export default class MyModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    // ...
  }

  registerServices(serviceContainer) {
    serviceContainer.registerService('shell_procedure', ShellProcedure, []);
  }
}
```

Now other modules can use your installation procedure in their manifest:

```json
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    // ...
    "installationProcedures": {
      "shell_procedure": {
        "commands": [
          "tsc --init",
          "cp tsconfig.json tsconfig.prod.json",
          "cp tsconfig.json tsconfig.test.json"
        ]
      }
    }
  }
}
```

#### File Copy Procedure

The module installer includes a built-in procedure for copying files from your module to the project:

```json
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    // ...
    "installationProcedures": {
      "copyFiles": [
        // source (relative to module's path) - destination (relative to project's path)
        ["base-files/config.yaml", "config/my-module.yaml"]
      ]
    }
  }
}
```

This configuration copies `base-file/config.yaml` from the module directory to `config/my-module.yaml` in the project.

The source path supports wildcards and globbing patterns.

## Events

### Installation Events

```typescript
// TypeScript
import { INSTALLATION_EVENTS } from '@alliage/module-installer';
```

| Type                                    | Event object                                                            | Description                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `INSTALLATION_EVENTS.PHASES_INIT`       | [InstallationPhasesInitEvent](#installationphasesinitevent)             | Triggered at the beginning of installation, allows defining available and default phases |
| `INSTALLATION_EVENTS.SCHEMA_VALIDATION` | [InstallationSchemaValidationEvent](#installationschemavalidationevent) | Triggered before manifest validation                                                      |
| `INSTALLATION_EVENTS.PHASE_START`       | [InstallationPhaseStartEvent](#installationphasestartevent)             | Triggered before an installation phase                                                   |
| `INSTALLATION_EVENTS.PHASE_END`         | [InstallationPhaseEndEvent](#installationphaseendevent)                 | Triggered after an installation phase                                                    |

#### InstallationPhasesInitEvent

This event is triggered during `INSTALLATION_EVENTS.PHASES_INIT` and provides:

- `getAvailablePhases(): string[]`: Returns available installation phases
- `getDefaultPhases(): string[]`: Returns default phases (used when not explicitly defined in install script arguments)
- `getEnv(): string`: Returns the current environment
- `setAvailablePhases(phases: string[]): InstallationPhasesInitEvent`: Redefines available phases
- `setDefaultPhases(phases: string[]): InstallationPhasesInitEvent`: Redefines default phases

#### InstallationSchemaValidationEvent

This event is triggered during `INSTALLATION_EVENTS.SCHEMA_VALIDATION` and provides:

- `getModuleName(): string`: Returns the name of the module being installed
- `getCurrentPhase(): string`: Returns the installation phase about to execute
- `getNextPhases(): string[]`: Returns the list of phases to execute afterward
- `getManifest(): object`: Returns the manifest content of the module being installed
- `getExtendedPropertiesSchemas(): object`: Gets the `installationProcedures` property validation schema
- `getEnv(): string`: Returns the current environment
- `setExtendedPropertiesSchemas(schema: object): InstallationSchemaValidationEvent`: Redefines the `installationProcedures` property validation schema

#### InstallationPhaseStartEvent

This event is triggered during `INSTALLATION_EVENTS.PHASE_START` and provides:

- `getModuleName(): string`: Returns the name of the module being installed
- `getModulePath(): string`: Returns the path of the module being installed
- `getPackageInfo(): object`: Returns the content of the module's `package.json` file
- `getManifest(): object`: Returns the content of the module's manifest
- `getCurrentPhase(): string`: Returns the installation phase about to execute
- `getNextPhases(): string[]`: Returns the list of phases to execute afterward
- `getEnv(): string`: Returns the current environment
- `setManifest(manifest: object): InstallationPhaseStartEvent`: Redefines the module's manifest
- `setCurrentPhase(phase: string): InstallationPhaseStartEvent`: Redefines the installation phase about to execute
- `setNextPhases(phases: string[]): InstallationPhaseStartEvent`: Redefines the phases to execute afterward

#### InstallationPhaseEndEvent

This event is triggered during `INSTALLATION_EVENTS.PHASE_END` and provides:

- `getModuleName(): string`: Returns the name of the module being installed
- `getModulePath(): string`: Returns the path of the module being installed
- `getPackageInfo(): object`: Returns the content of the module's `package.json` file
- `getManifest(): object`: Returns the content of the module's manifest
- `getCurrentPhase(): string`: Returns the installation phase that was executed
- `getNextPhases(): string[]`: Returns the list of phases to execute afterward
- `getEnv(): string`: Returns the current environment


### File Copy Events

```typescript
// TypeScript
import { FILE_COPY_EVENTS } from '@alliage/module-installer';
```


| Type                                | Event object                                                | Description                           |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `FILE_COPY_EVENTS.BEFORE_COPY_ALL`  | [FileCopyBeforeCopyAllEvent](#filecopybeforecopyallevent)   | Triggered before the file copy procedure executes |
| `FILE_COPY_EVENTS.AFTER_COPY_ALL`   | [FileCopyAfterCopyAllEvent](#filecopyaftercopyallevent)   | Triggered after the file copy procedure completes  |
| `FILE_COPY_EVENTS.BEFORE_COPY_FILE` | [FileCopyBeforeCopyFileEvent](#filecopybeforecopyfileevent) | Triggered before a specific file is copied                    |
| `FILE_COPY_EVENTS.AFTER_COPY_FILE`  | [FileCopyAfterCopyFileEvent](#filecopyaftercopyfileevent)   | Triggered after a specific file is copied                     |

#### FileCopyBeforeCopyAllEvent

This event is triggered during `FILE_COPY_EVENTS.BEFORE_COPY_ALL` and provides:

- `getModulePath(): string`: Returns the path of the module being installed
- `getFilesToCopy(): [string, string][]`: Returns the list of files to copy
- `setModulePath(path: string): FileCopyBeforeCopyAllEvent`: Redefines the module path
- `setFilesToCopy(filesToCopy: [string, string][]): FileCopyBeforeCopyAllEvent`: Redefines the list of files to copy

#### FileCopyAfterCopyAllEvent

This event is triggered during `FILE_COPY_EVENTS.AFTER_COPY_ALL` and provides:

- `getModulePath(): string`: Returns the path of the module being installed
- `getCopiedFiles(): [string, string][]`: Returns the list of files that were copied

#### FileCopyBeforeCopyFileEvent

This event is triggered during `FILE_COPY_EVENTS.BEFORE_COPY_FILE` and provides:

- `getModulePath(): string`: Returns the path of the module being installed
- `getSourceFile(): string`: Returns the absolute path of the source file
- `getDestination(): string`: Returns the absolute path of the destination
- `setSourceFile(path: string): FileCopyBeforeCopyFileEvent`: Redefines the path of the source file
- `setDestination(path: string): FileCopyBeforeCopyFileEvent`: Redefines the path of the destination

#### FileCopyAfterCopyFileEvent

This event is triggered during `FILE_COPY_EVENTS.AFTER_COPY_FILE` and provides:

- `getModulePath(): string`: Returns the path of the module being installed
- `getSourceFile(): string`: Returns the absolute path of the source file
- `getDestination(): string`: Returns the absolute path of the destination
