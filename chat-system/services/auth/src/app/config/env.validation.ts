import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const databaseConfigSchema = z.object({
    type: z.enum(['postgres']),
    host: z.string(),
    port: z.coerce.number(),
    username: z.string(),
    password: z.string(),
    database: z.string(),
    synchronize: z.boolean(),
});

export const DATABASE_CONFIG_KEY = 'db_config';

const databaseConfig = registerAs(DATABASE_CONFIG_KEY, () => {
    return databaseConfigSchema.parse({
        type: process.env.DB_TYPE,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV !== 'production',
    });
});

export default databaseConfig;