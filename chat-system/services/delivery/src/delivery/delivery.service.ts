import { Inject, Injectable, Logger } from "@nestjs/common";

import { REDIS_CLIENT } from "@libs/shared/src/constants/redis.constants";
import Redis from "ioredis";
import { DeliverMessageRequestDto } from "./dto/deliver.request.dto";

@Injectable()
export class DeliveryService {

    private readonly logger = new Logger(DeliveryService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis
    ) { }

    async deliverMessage(deliverMessageDto: DeliverMessageRequestDto) {
        const { channelId, message, offlineUsersEmails } = deliverMessageDto;

        await this.redisService.publish(`channel:${channelId}`, JSON.stringify(message));

        offlineUsersEmails.forEach(email => {
            this.logger.log(`[MOCK EMAIL] → user: ${email} | channel: ${channelId}`);
        })
    }
}   