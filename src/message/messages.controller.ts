import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'

import { MessagesService } from './messages.service'
import {
    CreateContactMessageDto,
    ListContactMessagesDto,
    UpdateMessageStatusDto,
    ReplyToContactMessageDto,
} from './dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    create(@Body() dto: CreateContactMessageDto) {
        return this.messagesService.create(dto)
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPPORT')
    findAll(@Query() query: ListContactMessagesDto) {
        return this.messagesService.findAll(query)
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPPORT')
    findOne(@Param('id') id: string) {
        return this.messagesService.findOne(id)
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPPORT')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateMessageStatusDto,
    ) {
        return this.messagesService.updateStatus(id, dto)
    }

    @Patch(':id/read')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPPORT')
    markAsRead(@Param('id') id: string) {
        return this.messagesService.markAsRead(id)
    }

    @Post(':id/reply')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPPORT')
    reply(
        @Param('id') id: string,
        @Body() dto: ReplyToContactMessageDto,
        @Req() req: Request,
    ) {
        const user = req.user as { userId: string }
        return this.messagesService.replyToMessage(id, user.userId, dto)
    }
}
