export enum KafkaConfig {
    CLIENT_ID = 'messaging-service',
    DEFAULT_BROKER = 'kafka:9092',
}

export enum KafkaLog {
    CONNECTING = 'Kafka connection connecting...',
    CONNECTED = 'Kafka connection connected',
    DISCONNECTING = 'Kafka connection disconnecting...',
    DISCONNECTED = 'Kafka connection disconnected',
}

export enum MessageTable {
    MESSAGES = 'messages',
}

/** Mask Confluent API key for logs (never log the secret). */
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '****';
  }
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/** One-line summary: Confluent vs local broker, topic, masked API key if any. */
export function formatKafkaBootstrapLine(
  role: 'producer' | 'consumer',
  kafka: {
    broker: string;
    topic: string;
    clientId: string;
    consumerGroup?: string;
    saslUsername?: string;
    saslPassword?: string;
    sessionTimeoutMs?: number;
  },
): string {
  const confluent = Boolean(kafka.saslUsername && kafka.saslPassword);
  const stack = confluent
    ? 'Confluent Cloud (SASL_SSL + TLS)'
    : 'local Kafka (PLAINTEXT, no SASL)';
  let line = `[Kafka ${role}] ${stack} | broker=${kafka.broker} | topic=${kafka.topic} | clientId=${kafka.clientId}`;
  if (kafka.consumerGroup) {
    line += ` | groupId=${kafka.consumerGroup}`;
  }
  if (kafka.sessionTimeoutMs != null) {
    line += ` | sessionTimeoutMs=${kafka.sessionTimeoutMs}`;
  }
  if (confluent && kafka.saslUsername) {
    line += ` | apiKey=${maskApiKey(kafka.saslUsername)} (secret redacted)`;
  }
  return line;
}
