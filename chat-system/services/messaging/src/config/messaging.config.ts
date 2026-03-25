import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const messagingConfigSchema = z.object({
  kafka: z.object({
    clientId: z.string().default('messaging-service'),
    broker: z.string().default('localhost:9092'),
    topic: z.string(),
    consumerGroup: z.string(),
  }),
  services: z.object({
    presenceUrl: z.url(),
    deliveryUrl: z.url(),
    authUrl: z.url(),
    channelUrl: z.url(),
  }),
});

export type MessagingConfig = z.infer<typeof messagingConfigSchema>;

export const MESSAGING_CONFIG_KEY = 'messaging';

const messagingConfig = registerAs(MESSAGING_CONFIG_KEY, () => {
  return messagingConfigSchema.parse({
    kafka: {
      clientId: process.env.KAFKA_CLIENT_ID,
      broker: process.env.KAFKA_BROKER,
      topic: process.env.KAFKA_TOPIC,
      consumerGroup: process.env.KAFKA_CONSUMER_GROUP,
    },
    services: {
      presenceUrl: process.env.PRESENCE_SERVICE_URL,
      deliveryUrl: process.env.DELIVERY_SERVICE_URL,
      authUrl: process.env.AUTH_SERVICE_URL,
      channelUrl: process.env.CHANNEL_SERVICE_URL,
    },
  });
});

export default messagingConfig;
