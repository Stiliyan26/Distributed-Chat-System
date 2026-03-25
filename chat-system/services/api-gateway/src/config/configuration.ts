import { z } from 'zod';

const configSchema = z.object({
    port: z.coerce.number().default(3000),
    jwtSecret: z.string(),
    services: z.object({
        auth: z.object({
            url: z.url().default('http://localhost:3001'),
        }),
        channel: z.object({
            url: z.url().default('http://localhost:3002'),
        }),
        messaging: z.object({
            url: z.url().default('http://localhost:3003'),
        }),
        chat: z.object({
            url: z.url().default('http://localhost:3000'),
        }),
    }),
});

export default () => {
    return configSchema.parse({
        port: process.env.PORT,
        jwtSecret: process.env.JWT_SECRET,
        services: {
            auth: {
                url: process.env.AUTH_SERVICE_URL,
            },
            channel: {
                url: process.env.CHANNEL_SERVICE_URL,
            },
            messaging: {
                url: process.env.MESSAGING_SERVICE_URL,
            },
            chat: {
                url: process.env.CHAT_SERVICE_URL,
            },
        },
    });
};