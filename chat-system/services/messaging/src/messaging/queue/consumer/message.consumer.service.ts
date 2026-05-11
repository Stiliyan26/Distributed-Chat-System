import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";

import { kafkaJsClientConfig, MESSAGING_CONFIG_KEY, MessagingConfig } from "../../../config/messaging.config";
import { KafkaLog, formatKafkaBootstrapLine } from "../../constants/messaging.constants";
import { KafkaMessagePayloadDto } from "../../dto/kafka/kafka-message-payload.dto";
import { MessagePersistenceService } from "../../message.persistence.service";

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
    const k = this.messagingConfig.kafka;
    this.logger.log(
      formatKafkaBootstrapLine('consumer', {
        ...k,
        consumerGroup: k.consumerGroup,
        sessionTimeoutMs: k.sessionTimeoutMs ?? 45_000,
      }),
    );

    this.kafka = new Kafka(kafkaJsClientConfig(this.messagingConfig.kafka));

    const sessionTimeout =
      this.messagingConfig.kafka.sessionTimeoutMs ?? 45_000;

    this.consumer = this.kafka.consumer({
      groupId: this.messagingConfig.kafka.consumerGroup,
      sessionTimeout,
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
      this.logger.warn(`Received empty message on partition ${partition}`);
      return;
    }

    try {
      const rawPayload = JSON.parse(value);

      const payload = plainToInstance(KafkaMessagePayloadDto, rawPayload);

      const errors = await validate(payload);

      if (errors.length > 0) {
        this.extractErrorMessage(errors);
        return;
      }

      if (!payload.channelId || !payload.senderId || !payload.content) {
        this.logger.error(`Malformed message payload: ${value}`);
        return;
      }

      this.logger.log(`Processing message from channel ${payload.channelId} partition ${partition}`);
      await this.messagePersistenceService.save(payload);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      this.logger.error(`Failed to parse Kafka message: ${errorMessage}. Raw message: ${value}`);
    }
  }

  private extractErrorMessage(errors: ValidationError[]): void {
    const message = errors
      .map(err => Object.values(err.constraints || {}).join(', '))
      .join('; ');

    this.logger.error(`Validation failed for Kafka message: ${message}`);
  }
}