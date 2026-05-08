import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const chatConfigSchema = z.object({
  services: z.object({
    messagingUrl: z.url(),
    presenceUrl: z.url(),
  }),
  jwtSecret: z.string().min(1),
});

export type ChatConfig = z.infer<typeof chatConfigSchema>;

export const CHAT_CONFIG_KEY = 'chat';

const chatConfig = registerAs(CHAT_CONFIG_KEY, () => {
  return chatConfigSchema.parse({
    services: {
      messagingUrl: process.env.MESSAGING_SERVICE_URL,
      presenceUrl: process.env.PRESENCE_SERVICE_URL,
    },
    jwtSecret: process.env.JWT_SECRET,
  });
});

export default chatConfig;
