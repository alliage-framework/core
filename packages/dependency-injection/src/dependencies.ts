import get from 'lodash.get';

export enum DEPENDENCY {
  SERVICE = 'DEPENDENCY/SERVICE',
  PARAMETER = 'DEPENDENCY/PARAMETER',
  INSTANCE_OF = 'DEPENDENCY/INSTANCE_OF',
  ALL_INSTANCES_OF = 'DEPENDENCY/ALL_INSTANCES_OF',
}

export type Constructor = {
  // Necessary for representing any constructor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
};

export interface ServiceDependency {
  type: DEPENDENCY.SERVICE;
  name: string;
}

export interface ParameterDependency {
  type: DEPENDENCY.PARAMETER;
  getter: (parameters: object) => unknown;
}

export interface InstanceOfDependency {
  type: DEPENDENCY.INSTANCE_OF;
  ctor: Constructor;
}

export interface AllInstancesOfDependency {
  type: DEPENDENCY.ALL_INSTANCES_OF;
  ctor: Constructor;
}

export type Dependency =
  | ServiceDependency
  | ParameterDependency
  | InstanceOfDependency
  | AllInstancesOfDependency;

export function service(name: string): ServiceDependency {
  return {
    type: DEPENDENCY.SERVICE,
    name,
  };
}

export type ParameterGetter = (parameters: object) => unknown;

export function parameter(path: string | ParameterGetter): ParameterDependency {
  let getter: ParameterGetter;
  if (typeof path === 'string') {
    getter = (parameters: object) => get(parameters, path);
    Object.defineProperty(getter, 'name', { value: path });
  } else {
    getter = path;
  }
  return {
    type: DEPENDENCY.PARAMETER,
    getter,
  };
}

export function instanceOf(ctor: Constructor): InstanceOfDependency {
  return {
    type: DEPENDENCY.INSTANCE_OF,
    ctor,
  };
}

export function allInstancesOf(ctor: Constructor): AllInstancesOfDependency {
  return {
    type: DEPENDENCY.ALL_INSTANCES_OF,
    ctor,
  };
}
