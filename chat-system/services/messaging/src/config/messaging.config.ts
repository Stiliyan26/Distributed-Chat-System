import { registerAs } from '@nestjs/config';
import type { KafkaConfig } from 'kafkajs';
import { z } from 'zod';

const kafkaEnvSchema = z
  .object({
    clientId: z.string().default('messaging-service'),
    broker: z.string().default('localhost:9092'),
    topic: z.string(),
    consumerGroup: z.string(),
    saslUsername: z.string().optional(),
    saslPassword: z.string().optional(),
    sessionTimeoutMs: z.coerce.number().optional(),
  })
  .refine(
    (k) => Boolean(k.saslUsername) === Boolean(k.saslPassword),
    {
      error:
        'Set both KAFKA_SASL_USERNAME and KAFKA_SASL_PASSWORD (Confluent API key + secret), or KAFKA_API_KEY and KAFKA_API_SECRET, or omit all four for local Kafka.',
      path: ['saslUsername'],
    },
  );

const messagingConfigSchema = z.object({
  kafka: kafkaEnvSchema,
  services: z.object({
    presenceUrl: z.url(),
    deliveryUrl: z.url(),
    authUrl: z.url(),
    channelUrl: z.url(),
  }),
});

export type MessagingConfig = z.infer<typeof messagingConfigSchema>;

export const MESSAGING_CONFIG_KEY = 'messaging';

/** Shared KafkaJS client options (local PLAINTEXT vs Confluent SASL_SSL). */
export function kafkaJsClientConfig(
  kafka: MessagingConfig['kafka'],
): KafkaConfig {
  const base: KafkaConfig = {
    clientId: kafka.clientId,
    brokers: [kafka.broker],
  };

  if (kafka.saslUsername && kafka.saslPassword) {
    return {
      ...base,
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: kafka.saslUsername,
        password: kafka.saslPassword,
      },
    };
  }

  return base;
}

const messagingConfig = registerAs(MESSAGING_CONFIG_KEY, () => {
  // Confluent Cloud: create API key in the UI; use key as username and secret as password (SASL PLAIN).
  // Either KAFKA_SASL_* or KAFKA_API_* (same values — Confluent naming vs Kafka naming).
  const saslUsername =
    process.env.KAFKA_SASL_USERNAME ?? process.env.KAFKA_API_KEY;
  const saslPassword =
    process.env.KAFKA_SASL_PASSWORD ?? process.env.KAFKA_API_SECRET;
  return messagingConfigSchema.parse({
    kafka: {
      clientId: process.env.KAFKA_CLIENT_ID,
      broker: process.env.KAFKA_BROKER,
      topic: process.env.KAFKA_TOPIC,
      consumerGroup: process.env.KAFKA_CONSUMER_GROUP,
      saslUsername,
      saslPassword,
      sessionTimeoutMs: process.env.KAFKA_SESSION_TIMEOUT_MS,
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
