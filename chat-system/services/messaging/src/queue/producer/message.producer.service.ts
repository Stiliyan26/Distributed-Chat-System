import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_CONFIG } from "../../config/kafka.config";
import { KafkaLog } from "../../constants";
import { MessageDto } from "../../dto/request/message.dto";

@Injectable()
export class MessageProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.clientId,
      brokers: KAFKA_CONFIG.brokers,
    });

    this.producer = this.kafka.producer();

    console.log(KafkaLog.CONNECTING);
    await this.producer.connect();
    console.log(KafkaLog.CONNECTED);
  }

  async onModuleDestroy() {
    console.log(KafkaLog.DISCONNECTING);
    await this.producer.disconnect();
    console.log(KafkaLog.DISCONNECTED);
  }

  async publish(message: MessageDto) {
    await this.producer.send({
      topic: KAFKA_CONFIG.topic,
      messages: [
        {
          key: message.channelId,
          value: JSON.stringify(message),
        }
      ]
    });
  }
}