import { KafkaConfig } from "../constants/kafka.constants";

export const KAFKA_CONFIG = {
  clientId: KafkaConfig.CLIENT_ID,
  brokers: [process.env.KAFKA_BROKER || KafkaConfig.DEFAULT_BROKER],
  topic: process.env.KAFKA_TOPIC,
  consumerGroup: process.env.KAFKA_CONSUMER_GROUP
}