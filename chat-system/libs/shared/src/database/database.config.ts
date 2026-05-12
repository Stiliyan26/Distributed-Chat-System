import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Supports two modes:
//   1. DATABASE_URL (Neon / cloud) — single connection string, SSL auto-enabled
//   2. DB_HOST + DB_PORT + DB_USERNAME + DB_PASSWORD + DB_NAME (local docker-compose)

const databaseConfigSchema = z.union([
    z.object({
        url: z.string().url(),
        ssl: z.literal(true),
        synchronize: z.boolean(),
    }),
    z.object({
        type: z.literal('postgres'),
        host: z.string(),
        port: z.coerce.number(),
        username: z.string(),
        password: z.string(),
        database: z.string(),
        ssl: z.literal(false),
        synchronize: z.boolean(),
    }),
]);

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export const DATABASE_CONFIG_KEY = 'db_config';

const databaseConfig = registerAs(DATABASE_CONFIG_KEY, (): DatabaseConfig => {
    const synchronize = process.env.DB_SYNC === 'true' || process.env.NODE_ENV !== 'production';

    if (process.env.DATABASE_URL) {
        return databaseConfigSchema.parse({
            url: process.env.DATABASE_URL,
            ssl: true,
            synchronize,
        });
    }

    return databaseConfigSchema.parse({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: false,
        synchronize,
    });
});

export default databaseConfig;