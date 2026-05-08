import { z } from 'zod';

const configSchema = z.object({
    port: z.coerce.number().default(3000),
    jwtSecret: z.string(),
    gateway: z.object({
        proxyTimeoutMs: z.coerce.number().default(30_000),
        proxyBodyLimit: z.string().default('512kb'),
        breakerHalfOpenAfterMs: z.coerce.number().default(10_000),
        breakerConsecutiveFailures: z.coerce.number().default(5),
        bulkheadConcurrency: z.coerce.number().default(50),
        bulkheadQueue: z.coerce.number().default(200),
        throttleTtlMs: z.coerce.number().default(60_000),
        throttleLimit: z.coerce.number().default(200),
    }),
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
        presence: z.object({
            url: z.url().default('http://localhost:3004'),
        }),
    }),
});

export default () => {
    return configSchema.parse({
        port: process.env.PORT,
        jwtSecret: process.env.JWT_SECRET,
        gateway: {
            proxyTimeoutMs: process.env.GATEWAY_PROXY_TIMEOUT_MS,
            proxyBodyLimit: process.env.GATEWAY_BODY_LIMIT,
            breakerHalfOpenAfterMs: process.env.GATEWAY_BREAKER_HALF_OPEN_MS,
            breakerConsecutiveFailures: process.env.GATEWAY_BREAKER_CONSECUTIVE_FAILURES,
            bulkheadConcurrency: process.env.GATEWAY_BULKHEAD_CONCURRENCY,
            bulkheadQueue: process.env.GATEWAY_BULKHEAD_QUEUE,
            throttleTtlMs: process.env.GATEWAY_THROTTLE_TTL_MS,
            throttleLimit: process.env.GATEWAY_THROTTLE_LIMIT,
        },
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
            presence: {
                url: process.env.PRESENCE_SERVICE_URL,
            },
        },
    });
};