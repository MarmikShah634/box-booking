import { envSchema } from './env.schema';

let _config: ReturnType<typeof envSchema.parse> | null = null;

export function loadConfig() {
  if (_config) return _config;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${issues}`);
  }
  _config = result.data;
  return _config;
}

export const configuration = () => loadConfig();
