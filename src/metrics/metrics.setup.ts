import { collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics({
  prefix: 'ecommerce_backend_',
});
