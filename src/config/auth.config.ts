import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  accessTtl: process.env.JWT_ACCESS_TTL!,
  refreshTtl: process.env.JWT_REFRESH_TTL!,
}));
