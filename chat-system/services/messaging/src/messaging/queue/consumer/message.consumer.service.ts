import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";

import { ConfigService } from "@nestjs/config";
import { MESSAGING_CONFIG_KEY, MessagingConfig } from "../../../config/messaging.config";
import { MessagePersistenceService } from "../../message.persistence.service";
import { KafkaLog } from "../../constants/messaging.constants";
import { KafkaMessagePayloadDto } from "../../dto/kafka/kafka-message-payload.dto";

@Injectable()
export class MessageConsumerService implements OnModuleInit, OnModuleDestroy {
  
  private readonly logger = new Logger(MessageConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly messagePersistenceService: MessagePersistenceService,
    private readonly configService: ConfigService<{ [MESSAGING_CONFIG_KEY]: MessagingConfig }>
  ) { }

  private get messagingConfig() {
    return this.configService.get(MESSAGING_CONFIG_KEY, { infer: true })!;
  }

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: this.messagingConfig.kafka.clientId,
      brokers: [this.messagingConfig.kafka.broker]
    });

    this.consumer = this.kafka.consumer({
      groupId: this.messagingConfig.kafka.consumerGroup
    });

    this.logger.log(KafkaLog.CONNECTING);
    await this.consumer.connect();
    this.logger.log(KafkaLog.CONNECTED);

    this.subscribeToTopic();
    this.onMessage();
  }

  async onModuleDestroy() {
    this.logger.log(KafkaLog.DISCONNECTING);
    await this.consumer.disconnect();
    this.logger.log(KafkaLog.DISCONNECTED);
  }

  private async subscribeToTopic() {
    await this.consumer.subscribe({
      topics: [this.messagingConfig.kafka.topic],
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

  private async handleMessage({ partition, message }: EachMessagePayload) {
    const value = message.value?.toString();

    if (!value) {
      return;
    }

    const kafkaMessagePayloadDto: KafkaMessagePayloadDto = JSON.parse(value);

    this.logger.log(`Processing message from channel ${kafkaMessagePayloadDto.channelId} partition ${partition}`);

    await this.messagePersistenceService.save(kafkaMessagePayloadDto);
  }
}