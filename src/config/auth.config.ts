import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export default registerAs('auth', () => ({
  access: {
    secret: process.env.JWT_ACCESS_SECRET!,
    ttl: process.env.JWT_ACCESS_TTL! as StringValue,
    issuer: 'auth-service',
    audience: 'api',
  },
  refresh: {
    ttl: process.env.JWT_REFRESH_TTL! as StringValue,
  },
}));
