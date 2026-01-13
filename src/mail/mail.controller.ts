import { Body, Controller, Post, ForbiddenException } from '@nestjs/common';
import { MailService } from './mail.service';
import { TestEmailDto } from './dto/test-email.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('mail')
export class MailController {
    constructor(private readonly mailService: MailService) { }
    @Public()
    @Post('test')
    async sendTestEmail(@Body() dto: TestEmailDto): Promise<void> {
        // if (process.env.NODE_ENV === 'production') {
        //     throw new ForbiddenException();
        // }
        await this.mailService.sendTestEmail(dto.email);
    }
}
