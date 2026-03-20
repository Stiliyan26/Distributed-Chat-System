import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import { Kafka, Producer } from 'kafkajs';

import { KAFKA_CONFIG } from "../../config/kafka.config";
import { KafkaLog } from "../../constants/kafka.constants";
import { KafkaMessagePayload } from "../../dto/kafka/kafka-message.payload";
import { MessageRequestDto } from "../../dto/request/message.request.dto";
import { DeliveryRequest, PublishMessageResponse } from '../../interfaces/message.interface';

import { AuthHeader } from "@libs/shared/src/constants/auth.constants";
import { CommonConstants } from "@libs/shared/src/constants/common.constants";
import { ChannelRoutes, DeliveryRoutes, PresenceRoutes, UserRoutes } from "@libs/shared/src/constants/routes.constants";
import { ChannelMembersResponse } from '@libs/shared/src/interfaces/channel.interface';
import { UserStatusResponse } from '@libs/shared/src/interfaces/presence.interface';

@Injectable()
export class MessageProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;


  private readonly getAllMemberStatusesUrl = `${process.env.PRESENCE_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${PresenceRoutes.PREFIX}/${PresenceRoutes.STATUS}`;
  private readonly deliveryServiceDeliveryUrl = `${process.env.DELIVERY_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${DeliveryRoutes.PREFIX}/${DeliveryRoutes.RECIEVE}`;

  private readonly getAllEmailsUrl = `${process.env.AUTH_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${UserRoutes.PREFIX}/${UserRoutes.EMAILS}`;

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

  async publish(messageDto: MessageRequestDto, senderId: string): Promise<PublishMessageResponse> {
    await this.persistMessageToKafka(messageDto, senderId);

    setImmediate(async () => {
      try {
        const { memberIds } = await this.getAllMemberIdsInAChannel(messageDto.channelId, senderId);

        const { offlineUserIds } = await this.getAllMemberStatuses(memberIds);
        
        const offlineUsersEmails = await this.getOfflineUsersEmails(offlineUserIds);

        await this.publishMessageToDeliveryService(offlineUsersEmails, senderId, messageDto);

      } catch (err: any) {
        if (err?.response?.data) {
          console.error('[Delivery] Response data:', JSON.stringify(err.response.data));
        }
        if (err?.config?.url) {
          console.error('[Delivery] Failed URL:', err.config.method?.toUpperCase(), err.config.url);
        }
      }
    });

    return { success: 'Message sucessfully sent' };
  }

  private async getAllMemberIdsInAChannel(
    channelId: string,
    senderId: string
  ): Promise<ChannelMembersResponse> {
    const { data } = await axios.get<ChannelMembersResponse>(
      this.getAllChannelMembersUrl(channelId),
      { headers: { [AuthHeader.USER_ID]: senderId } }
    );

    return data;
  }

  private async getAllMemberStatuses(userIds: string[]): Promise<UserStatusResponse> {
    const { data } = await axios.post<UserStatusResponse>(
      this.getAllMemberStatusesUrl,
      { userIds }
    );

    return data;
  }

  private async publishMessageToDeliveryService(
    offlineUsersEmails: string[],
    senderId: string,
    messageRequestDto: MessageRequestDto
  ): Promise<void> {
    const deliveryRequest: DeliveryRequest = {
      channelId: messageRequestDto.channelId,
      offlineUsersEmails,
      message: {
        content: messageRequestDto.content,
        senderId,
        senderUsername: messageRequestDto.senderUsername,
        sentAt: messageRequestDto.sentAt
      }
    };

    await axios.post<void>(this.deliveryServiceDeliveryUrl, deliveryRequest);
  }

  private async getOfflineUsersEmails(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    const { data } = await axios.post<string[]>(this.getAllEmailsUrl, { ids });

    return data;
  }

  private async persistMessageToKafka(
    messageDto: MessageRequestDto,
    senderId: string
  ): Promise<void> {
    const payload: KafkaMessagePayload = {
      channelId: messageDto.channelId,
      senderId,
      senderUsername: messageDto.senderUsername,
      content: messageDto.content,
      sentAt: messageDto.sentAt,
    };

    await this.producer.send({
      topic: KAFKA_CONFIG.topic,
      messages: [
        {
          key: payload.channelId,
          value: JSON.stringify(payload),
        }
      ]
    });
  }

  private getAllChannelMembersUrl(channelId: string) {
    return `${process.env.CHANNEL_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${ChannelRoutes.PREFIX}/${channelId}/members`;
  }
}