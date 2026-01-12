import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { register } from 'prom-client';

@Public()
@Controller('metrics')
export class MetricsController {
    @Get()
    async getMetrics(@Res() res: Response) {
        res.setHeader('Content-Type', register.contentType);
        res.end(await register.metrics());
    }
}
