import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import { Kafka, Producer } from 'kafkajs';

import { ChannelRoutes, DeliveryRoutes, PresenceRoutes, UserRoutes } from "@libs/shared/src/constants/routes.constants";
import { CommonConstants } from "@libs/shared/src/constants/common.constants";
import { AuthHeader } from "@libs/shared/src/constants/auth.constants";

import { ConfigService } from "@nestjs/config";
import { MESSAGING_CONFIG_KEY, MessagingConfig } from "../../../config/messaging.config";
import { KafkaLog } from "../../constants/messaging.constants";
import { KafkaMessagePayloadDto } from "../../dto/kafka/kafka-message-payload.dto";
import { PublishMessageRequestDto } from "../../dto/request/publish-message.request.dto";
import { ChannelMembersResponse } from '@libs/shared/src/interfaces/channel.interface';
import { DeliveryRequest, PublishMessageResponse } from '../../interfaces/message.interface';
import { UserStatusResponse } from '@libs/shared/src/interfaces/presence.interface';

@Injectable()
export class MessageProducerService implements OnModuleInit, OnModuleDestroy {
  
  private readonly logger = new Logger(MessageProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService<{ [MESSAGING_CONFIG_KEY]: MessagingConfig }>) { }

  private get messagingConfig() {
    return this.configService.get(MESSAGING_CONFIG_KEY, { infer: true })!;
  }


  private get presenceServiceUrl() {
    return this.messagingConfig.services.presenceUrl;
  }

  private get deliveryServiceUrl() {
    return this.messagingConfig.services.deliveryUrl;
  }

  private get authServiceUrl() {
    return this.messagingConfig.services.authUrl;
  }

  private get channelServiceUrl() {
    return this.messagingConfig.services.channelUrl;
  }

  private get getAllMemberStatusesUrl() {
    return `${this.presenceServiceUrl}/${CommonConstants.GLOBAL_PREFIX}/${PresenceRoutes.PREFIX}/${PresenceRoutes.STATUS}`;
  }

  private get deliveryServiceDeliveryUrl() {
    return `${this.deliveryServiceUrl}/${CommonConstants.GLOBAL_PREFIX}/${DeliveryRoutes.PREFIX}/${DeliveryRoutes.RECEIVE}`;
  }

  private get getAllEmailsUrl() {
    return `${this.authServiceUrl}/${CommonConstants.GLOBAL_PREFIX}/${UserRoutes.PREFIX}/${UserRoutes.EMAILS}`;
  }

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: this.messagingConfig.kafka.clientId,
      brokers: [this.messagingConfig.kafka.broker],
    });

    this.producer = this.kafka.producer();

    this.logger.log(KafkaLog.CONNECTING);
    await this.producer.connect();
    this.logger.log(KafkaLog.CONNECTED);
  }

  async onModuleDestroy() {
    this.logger.log(KafkaLog.DISCONNECTING);
    await this.producer.disconnect();
    this.logger.log(KafkaLog.DISCONNECTED);
  }

  async publish(publishMessageRequestDto: PublishMessageRequestDto, senderId: string): Promise<PublishMessageResponse> {
    await this.persistMessageToKafka(publishMessageRequestDto, senderId);

    setImmediate(async () => {
      try {
        const { memberIds } = await this.getAllMemberIdsInAChannel(publishMessageRequestDto.channelId, senderId);

        const { offlineUserIds, onlineUserIds } = await this.getAllMemberStatuses(memberIds);
        
        this.logger.debug(`[MessagingWorker] Channel ${publishMessageRequestDto.channelId} statuses -> Online: ${onlineUserIds?.length || 0}, Offline: ${offlineUserIds.length}`);

        const offlineUsersEmails = await this.getOfflineUsersEmails(offlineUserIds);

        this.logger.debug(`[MessagingWorker] Publish to Delivery Service -> Offline Emails: ${JSON.stringify(offlineUsersEmails)}`);

        await this.publishMessageToDeliveryService(offlineUsersEmails, senderId, publishMessageRequestDto);

      } catch (err: any) {
        if (err?.response?.data) {
          this.logger.error(`[Delivery] Response data: ${JSON.stringify(err.response.data)}`);
        }
        if (err?.config?.url) {
          this.logger.error(`[Delivery] Failed URL: ${err.config.method?.toUpperCase()} ${err.config.url}`);
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
    publishMessageRequestDto: PublishMessageRequestDto
  ): Promise<void> {
    const deliveryRequest: DeliveryRequest = {
      channelId: publishMessageRequestDto.channelId,
      offlineUsersEmails,
      message: {
        content: publishMessageRequestDto.content,
        senderId,
        senderUsername: publishMessageRequestDto.senderUsername,
        sentAt: publishMessageRequestDto.sentAt
      }
    };

    await axios.post(this.deliveryServiceDeliveryUrl, deliveryRequest);
  }

  private async getOfflineUsersEmails(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    const { data } = await axios.post<string[]>(this.getAllEmailsUrl, { ids });

    return data;
  }

  private async persistMessageToKafka(
    publishMessageRequestDto: PublishMessageRequestDto,
    senderId: string
  ): Promise<void> {
    const kafkaMessagePayloadDto: KafkaMessagePayloadDto = {
      channelId: publishMessageRequestDto.channelId,
      senderId,
      senderUsername: publishMessageRequestDto.senderUsername,
      content: publishMessageRequestDto.content,
      sentAt: publishMessageRequestDto.sentAt,
    };

    await this.producer.send({
      topic: this.messagingConfig.kafka.topic,
      messages: [
        {
          key: kafkaMessagePayloadDto.channelId,
          value: JSON.stringify(kafkaMessagePayloadDto),
        }
      ]
    });
  }

  private getAllChannelMembersUrl(channelId: string) {
    return `${this.channelServiceUrl}/${CommonConstants.GLOBAL_PREFIX}/${ChannelRoutes.PREFIX}/${channelId}/members`;
  }
}