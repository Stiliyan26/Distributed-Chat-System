import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { REDIS_DATABASE_URL, REDIS_PUBSUB_URL } from '../constants/redis.constants';

const redisPubSubConfigSchema = z.object({
  url: z.url(),
});

export type RedisPubSubConfig = z.infer<typeof redisPubSubConfigSchema>;

const redisPubSubConfig = registerAs('redis', () => {
  const url = process.env[REDIS_PUBSUB_URL] || process.env[REDIS_DATABASE_URL];

  if (!url) {
    throw new Error(
      `Set ${REDIS_PUBSUB_URL} to the same Redis as delivery (e.g. redis-pubsub), or ${REDIS_DATABASE_URL} as fallback. Must not be the presence Redis unless you intentionally use one Redis for everything.`,
    );
  }

  return redisPubSubConfigSchema.parse({ url });
});

export default redisPubSubConfig;
