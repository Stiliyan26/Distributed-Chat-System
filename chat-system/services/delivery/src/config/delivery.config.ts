import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const deliveryConfigSchema = z.object({
  smtpHost: z.string().default('smtp.ethereal.email'),
  smtpPort: z.coerce.number().default(587),
  smtpUser: z.string(),
  smtpPass: z.string(),
  redisUrl: z.url(),
});

export type DeliveryConfig = z.infer<typeof deliveryConfigSchema>;

export const DELIVERY_CONFIG_KEY = 'delivery';

const deliveryConfig = registerAs(DELIVERY_CONFIG_KEY, () => {
  return deliveryConfigSchema.parse({
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    redisUrl: process.env.REDIS_DATABASE_URL,
  });
});

export default deliveryConfig;
