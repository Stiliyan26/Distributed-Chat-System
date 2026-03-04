import { Inject, Injectable, Logger } from "@nestjs/common";

import { REDIS_CLIENT } from "@libs/shared/src";
import Redis from "ioredis";
import { DeliverMessageRequestDto } from "./dto/deliver.request.dto";
import { MessagePayloadDto } from "./dto/message-payload.dto";

@Injectable()
export class DeliveryService {

    private readonly logger = new Logger(DeliveryService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis
    ) { }

    async deliverMessage(deliverMessageDto: DeliverMessageRequestDto) {
        const { channelId, message, offlineUserIds } = deliverMessageDto;

        await this.publishMessageToChannel(
            `channel:${channelId}`,
            message
        );

        offlineUserIds.forEach(userId => {
            this.logger.log(`[MOCK EMAIL] → user: ${userId} | channel: ${channelId}`);
        })
    }

    private async publishMessageToChannel(
        channel: string,
        message: MessagePayloadDto
    ) {
        await this.redisService.publish(
            channel,
            JSON.stringify(message)
        )
    }
}   