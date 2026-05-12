import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import Redis from "ioredis";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { REDIS_CLIENT } from "@libs/shared/src/constants/redis.constants";
import { DELIVERY_CONFIG_KEY, DeliveryConfig } from "../config/delivery.config";
import { DeliverMessageRequestDto } from "./dto/deliver-message.request.dto";
import { DeliveryPayloadDto } from "./dto/delivery-payload.dto";

type OfflineEmailTemplateContext = {
    senderUsername: string;
    messageContent: string;
    channelId: string;
};

@Injectable()
export class DeliveryService implements OnModuleInit {

    private readonly logger = new Logger(DeliveryService.name);
    private offlineEmailTemplate?: (context: OfflineEmailTemplateContext) => string;

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis,
        private readonly configService: ConfigService<{ [DELIVERY_CONFIG_KEY]: DeliveryConfig }>
    ) { }

    private get deliveryConfig() {
        return this.configService.get(DELIVERY_CONFIG_KEY, { infer: true })!;
    }

    async onModuleInit() {
        const { sendgridApiKey, smtpFrom } = this.deliveryConfig;

        if (!sendgridApiKey) {
            this.logger.warn(
                'SENDGRID_API_KEY is not configured. Delivery service will stay up, but offline email delivery is disabled until the key is added.'
            );
            return;
        }

        sgMail.setApiKey(sendgridApiKey);

        this.logger.log(
            `SendGrid configured from=${smtpFrom}`
        );

        if (smtpFrom === 'stiliyan.nikolov02@gmail.com') {
            this.logger.warn(
                'SMTP_FROM is using the fallback sender. With SendGrid, set SMTP_FROM to a verified sender/domain or emails may be accepted by the app but never delivered.'
            );
        }

        try {
            await this.getOfflineEmailTemplate();
            this.logger.log('Offline email template loaded successfully.');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            this.logger.error(`Failed to load offline email template: ${message}`, stack);
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
        if (!this.deliveryConfig.sendgridApiKey) {
            this.logger.warn(
                `Skipping offline email delivery for channel ${channelId} because SENDGRID_API_KEY is missing.`
            );
            return;
        }

        const htmlTemplate = await this.getOfflineEmailTemplate();
        const fromEmail = this.deliveryConfig.smtpFrom;

        const results = await Promise.allSettled(
            offlineUsersEmails.map(async (email) => {
                this.logger.log(`SendGrid attempt: sending offline email to ${email}`);

                const html = htmlTemplate({
                    senderUsername: message.senderUsername,
                    messageContent: message.content,
                    channelId
                });

                const [response] = await sgMail.send({
                    to: email,
                    from: {
                        email: fromEmail,
                        name: "Chat System",
                    },
                    subject: `New message from ${message.senderUsername}`,
                    text: `${message.senderUsername} sent a new message while you were offline: ${message.content}`,
                    html,
                });

                this.logger.log(
                    `SendGrid success: sent email to ${email} statusCode=${response.statusCode}`
                );
            })
        );

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const reason =
                    result.reason instanceof Error
                        ? `${result.reason.message}\n${result.reason.stack ?? ''}`.trim()
                        : String(result.reason);
                this.logger.error(`SendGrid failed for ${offlineUsersEmails[index]}: ${reason}`);
            }
        });
    }

    private async getOfflineEmailTemplate() {
        if (this.offlineEmailTemplate) {
            return this.offlineEmailTemplate;
        }

        const templatePath = join(__dirname, "assets/templates/offline-email.hbs");
        const templateSource = await readFile(templatePath, "utf8");
        this.offlineEmailTemplate = Handlebars.compile<OfflineEmailTemplateContext>(templateSource);

        return this.offlineEmailTemplate;
    }
}