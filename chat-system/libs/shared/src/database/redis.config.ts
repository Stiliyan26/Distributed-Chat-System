import { registerAs } from '@nestjs/config';
import { z } from 'zod';
import { REDIS_DATABASE_URL } from '../constants/redis.constants';

const redisConfigSchema = z.object({
  url: z.url(),
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;

const redisConfig = registerAs('redis', () => {
  return redisConfigSchema.parse({
    url: process.env[REDIS_DATABASE_URL],
  });
});

export default redisConfig;
