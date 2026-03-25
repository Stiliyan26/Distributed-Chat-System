import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const presenceConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export const PRESENCE_CONFIG_KEY = 'presence';

const presenceConfig = registerAs(PRESENCE_CONFIG_KEY, () => {
  return presenceConfigSchema.parse({
    nodeEnv: process.env.NODE_ENV,
  });
});

export type PresenceConfig = z.infer<typeof presenceConfigSchema>;

export default presenceConfig;
