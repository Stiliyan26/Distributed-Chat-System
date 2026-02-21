import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { KAFKA_CONFIG } from "../../config/kafka.config";
import { KafkaLog } from "../../constants";
import { MessagePersistenceService } from "../../services/message.persistence.service";

@Injectable()
export class MessageConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private messagePersistenceService: MessagePersistenceService) { }

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.clientId,
      brokers: KAFKA_CONFIG.brokers
    });

    this.consumer = this.kafka.consumer({
      groupId: KAFKA_CONFIG.consumerGroup
    });

    console.log(KafkaLog.CONNECTING);
    await this.consumer.connect();
    console.log(KafkaLog.CONNECTED);

    this.subscribeToTopic();
    this.onMessage();
  }

  async onModuleDestroy() {
    console.log(KafkaLog.DISCONNECTING);
    await this.consumer.disconnect();
    console.log(KafkaLog.DISCONNECTED);
  }

  private async subscribeToTopic() {
    await this.consumer.subscribe({
      topics: [KAFKA_CONFIG.topic],
      fromBeginning: false
    });
  }

  private async onMessage() {
    this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      }
    });
  }

  private async handleMessage({ topic, partition, message }: EachMessagePayload) {
    const value = message.value?.toString();

    if (!value) {
      return;
    }

    const parsedMessage = JSON.parse(value);

    console.log(`Processing message ${parsedMessage} from channel ${parsedMessage.channelId} partition ${partition}]`);

    await this.messagePersistenceService.save(parsedMessage);
  }
}