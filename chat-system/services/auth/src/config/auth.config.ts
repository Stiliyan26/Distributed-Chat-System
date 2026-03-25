import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const authConfigSchema = z.object({
  jwtSecret: z.string(),
  jwtRefreshSecret: z.string(),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export const AUTH_CONFIG_KEY = 'auth_tokens';

const authConfig = registerAs(AUTH_CONFIG_KEY, () => {
  return authConfigSchema.parse({
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

export default authConfig;
