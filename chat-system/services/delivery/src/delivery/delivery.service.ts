import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CLIENT } from "@libs/shared/src/constants/redis.constants";
import { DELIVERY_CONFIG_KEY, DeliveryConfig } from "../config/delivery.config";
import { DeliverMessageRequestDto } from "./dto/deliver-message.request.dto";
import { DeliveryPayloadDto } from "./dto/delivery-payload.dto";

@Injectable()
export class DeliveryService implements OnModuleInit {

    private readonly logger = new Logger(DeliveryService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService<{ [DELIVERY_CONFIG_KEY]: DeliveryConfig }>
    ) { }

    private get deliveryConfig() {
        return this.configService.get(DELIVERY_CONFIG_KEY, { infer: true })!;
    }

    async onModuleInit() {
        const { smtpHost, smtpPort, smtpFrom } = this.deliveryConfig;

        this.logger.log(
            `SMTP configured host=${smtpHost} port=${smtpPort} from=${smtpFrom}`
        );

        if (smtpFrom === 'stiliyan.nikolov02@gmail.com') {
            this.logger.warn(
                'SMTP_FROM is using the fallback sender. With SendGrid, set SMTP_FROM to a verified sender/domain or emails may be accepted by the app but never delivered.'
            );
        }

        const transporter = (this.mailerService as unknown as {
            transporter?: { verify: () => Promise<void> };
        }).transporter;

        if (!transporter) {
            this.logger.warn('Mailer transporter instance is not exposed; skipping SMTP verify at startup.');
            return;
        }

        try {
            await transporter.verify();
            this.logger.log('SMTP transporter verification succeeded.');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            this.logger.error(`SMTP transporter verification failed: ${message}`, stack);
        }
    }

    async deliverMessage(deliverMessageRequestDto: DeliverMessageRequestDto) {
        const { channelId, message, offlineUsersEmails } = deliverMessageRequestDto;

        this.logger.log(`[DeliveryService] Received delivery request for channel: ${channelId}. Flowing offline emails: ${JSON.stringify(offlineUsersEmails)}`);

        // Real-time broadcast to online users via Redis Pub/Sub (include channelId for chat UI consumers)
        await this.redisService.publish(
            `channel:${channelId}`,
            JSON.stringify({ ...message, channelId }),
        );

        // Background email delivery for offline users (non-blocking)
        if (offlineUsersEmails.length > 0) {
            setImmediate(() => {
                this.sendEmails(offlineUsersEmails, message, channelId).catch((err) => {
                    this.logger.error(`sendEmails error: ${err}`);
                });
            });
        }
    }

    private async sendEmails(
        offlineUsersEmails: string[],
        message: DeliveryPayloadDto,
        channelId: string
    ): Promise<void> {
        const results = await Promise.allSettled(
            offlineUsersEmails.map(async (email) => {
                this.logger.log(`SMTP Attempt: Sending offline email to ${email}`);

                const info = await this.mailerService.sendMail({
                    to: email,
                    subject: `New message from ${message.senderUsername}`,
                    template: 'offline-email',
                    context: {
                        senderUsername: message.senderUsername,
                        messageContent: message.content,
                        channelId
                    }
                });

                this.logger.log(
                    `SMTP Success: Sent email to ${email} messageId=${info.messageId ?? 'n/a'} response=${info.response ?? 'n/a'}`
                );
            })
        );

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const reason =
                    result.reason instanceof Error
                        ? `${result.reason.message}\n${result.reason.stack ?? ''}`.trim()
                        : String(result.reason);
                this.logger.error(`SMTP Failed for ${offlineUsersEmails[index]}: ${reason}`);
            }
        });
    }
}