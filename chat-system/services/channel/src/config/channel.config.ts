import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const channelConfigSchema = z.object({
  port: z.coerce.number().default(3000),
});

export type ChannelConfig = z.infer<typeof channelConfigSchema>;

export const CHANNEL_CONFIG_KEY = 'channel';

const channelConfig = registerAs(CHANNEL_CONFIG_KEY, () => {
  return channelConfigSchema.parse({
    port: process.env.PORT,
  });
});

export default channelConfig;
