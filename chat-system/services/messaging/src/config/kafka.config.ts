export const KAFKA_CONFIG = {
  clientId: 'messaging-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  topic: 'messages',
  consumerGroup: 'messaging-workers'
}