import { Inject, Injectable, Logger } from "@nestjs/common";

import { MailerService } from "@nestjs-modules/mailer";
import Redis from "ioredis";

import { REDIS_CLIENT } from "@libs/shared/src/constants/redis.constants";
import { DeliverMessageRequestDto } from "./dto/deliver-message.request.dto";
import { DeliveryPayloadDto } from "./dto/delivery-payload.dto";

@Injectable()
export class DeliveryService {

    private readonly logger = new Logger(DeliveryService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis,
        private readonly mailerService: MailerService
    ) { }

    async deliverMessage(deliverMessageRequestDto: DeliverMessageRequestDto) {
        const { channelId, message, offlineUsersEmails } = deliverMessageRequestDto;

        this.logger.log(`[DeliveryService] Received delivery request for channel: ${channelId}. Flowing offline emails: ${JSON.stringify(offlineUsersEmails)}`);

        // Real-time broadcast to online users via Redis Pub/Sub
        await this.redisService.publish(`channel:${channelId}`, JSON.stringify(message));

        // Background email delivery for offline users
        if (offlineUsersEmails.length > 0) {
            await this.sendEmails(offlineUsersEmails, message, channelId);
        }
    }

    private async publishToSmtp(
        emails: string[],
        channelId: string,
        message: DeliveryPayloadDto,
    ) {
        await this.sendEmails(emails, message, channelId);
    }

    private async sendEmails(
        offlineUsersEmails: string[],
        message: DeliveryPayloadDto,
        channelId: string
    ) {
        return await Promise.all(
            offlineUsersEmails.map(email => {
                return this.mailerService.sendMail({
                    to: email,
                    subject: `New message from ${message.senderUsername}`,
                    template: 'offline-email', //Targets 'offline-email.hbs'
                    context: {
                        senderUsername: message.senderUsername,
                        messageContent: message.content,
                        channelId: channelId
                    }
                })
                    .then(() => this.logger.log(`SMTP Success: Sent email to ${email}`))
                    .catch((e) => this.logger.error(`SMTP Failed for ${email}: ${e.message}`))
            })
        );
    }
}   