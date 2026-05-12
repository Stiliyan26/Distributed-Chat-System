import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const deliveryConfigSchema = z.object({
  brevoApiKey: z.preprocess(
    (value) => {
      if (typeof value === 'string' && value.trim() === '') {
        return undefined;
      }

      return value;
    },
    z.string().min(1).optional()
  ),
});

export type DeliveryConfig = z.infer<typeof deliveryConfigSchema>;

export const DELIVERY_CONFIG_KEY = 'delivery';

const deliveryConfig = registerAs(DELIVERY_CONFIG_KEY, () => {
  return deliveryConfigSchema.parse({
    brevoApiKey: process.env.BREVO_API_KEY,
  });
});

export default deliveryConfig;