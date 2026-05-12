import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const deliveryConfigSchema = z.object({
  sendgridApiKey: z.preprocess(
    (value) => {
      if (typeof value === 'string' && value.trim() === '') {
        return undefined;
      }

      return value;
    },
    z.string().min(1).optional()
  ),
  smtpFrom: z.string().default('stiliyan.nikolov02@gmail.com'),
});

export type DeliveryConfig = z.infer<typeof deliveryConfigSchema>;

export const DELIVERY_CONFIG_KEY = 'delivery';

const deliveryConfig = registerAs(DELIVERY_CONFIG_KEY, () => {
  return deliveryConfigSchema.parse({
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    smtpFrom: process.env.SMTP_FROM,
  });
});

export default deliveryConfig;