export const KAFKA_CONFIG = {
  clientId: 'messaging-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  topic: process.env.KAFKA_TOPIC,
  consumerGroup: process.env.KAFKA_CONSUMER_GROUP
}