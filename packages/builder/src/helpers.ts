export type EnvInjectable =
  | string
  | number
  | boolean
  | null
  | undefined
  | EnvInjectable[]
  | { [key: string]: EnvInjectable };

const ENV_PLACEHOLDER_PATTERN = /\{ENV\}/g;

export function injectEnvironment(env: string, params: EnvInjectable): EnvInjectable {
  if (typeof params === 'string') {
    return params.replace(ENV_PLACEHOLDER_PATTERN, env);
  }
  if (Array.isArray(params)) {
    return params.map((value) => injectEnvironment(env, value));
  }
  if (typeof params === 'object' && params !== null) {
    const paramsCopy: Record<string, EnvInjectable> = { ...params };
    Object.entries(paramsCopy).forEach(([key, value]) => {
      paramsCopy[key] = injectEnvironment(env, value);
    });
    return paramsCopy;
  }
  return params;
}
