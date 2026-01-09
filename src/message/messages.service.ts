import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
    CreateContactMessageDto,
    ListContactMessagesDto,
    UpdateMessageStatusDto,
    ReplyToContactMessageDto,
} from './dto'
import {
    MessageStatus,
    ReplyChannel,
    Prisma,
} from '@prisma/client'

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) { }
    async create(dto: CreateContactMessageDto) {
        return this.prisma.contactMessage.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                subject: dto.subject,
                message: dto.message,
            },
        })
    }

    async findAll(filters: ListContactMessagesDto) {
        const {
            status,
            search,
            page = 1,
            limit = 20,
        } = filters

        const skip = (page - 1) * limit
        const take = limit

        const where: Prisma.ContactMessageWhereInput = {
            status: status ?? undefined,
            OR: search
                ? [
                    {
                        email: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                        },
                    },
                    {
                        name: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                        },
                    },
                    {
                        subject: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                        },
                    },
                    {
                        message: {
                            contains: search,
                            mode: Prisma.QueryMode.insensitive,
                        },
                    },
                ]
                : undefined,
        }

        const [items, total] = await this.prisma.$transaction([
            this.prisma.contactMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    lastRepliedBy: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                        },
                    },
                },
            }),
            this.prisma.contactMessage.count({ where }),
        ])

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    async findOne(id: string) {
        const message = await this.prisma.contactMessage.findUnique({
            where: { id },
            include: {
                replies: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                email: true,
                                displayName: true,
                            },
                        },
                    },
                },
            },
        })

        if (!message) {
            throw new NotFoundException('Contact message not found')
        }

        return message
    }

    async updateStatus(id: string, dto: UpdateMessageStatusDto) {
        if (dto.status === MessageStatus.REPLIED) {
            throw new BadRequestException(
                'REPLIED status can only be set via reply endpoint',
            )
        }

        const message = await this.prisma.contactMessage.findUnique({
            where: { id },
        })

        if (!message) {
            throw new NotFoundException('Contact message not found')
        }

        return this.prisma.contactMessage.update({
            where: { id },
            data: {
                status: dto.status,
                readAt:
                    dto.status === MessageStatus.READ && !message.readAt
                        ? new Date()
                        : message.readAt,
            },
        })
    }

    async markAsRead(id: string) {
        const message = await this.prisma.contactMessage.findUnique({
            where: { id },
        })

        if (!message) {
            throw new NotFoundException('Contact message not found')
        }

        if (message.status !== MessageStatus.NEW) {
            return message
        }

        return this.prisma.contactMessage.update({
            where: { id },
            data: {
                status: MessageStatus.READ,
                readAt: new Date(),
            },
        })
    }

    async replyToMessage(
        messageId: string,
        adminUserId: string,
        dto: ReplyToContactMessageDto,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const message = await tx.contactMessage.findUnique({
                where: { id: messageId },
            })

            if (!message) {
                throw new NotFoundException('Contact message not found')
            }

            const reply = await tx.contactMessageReply.create({
                data: {
                    contactMessageId: messageId,
                    authorId: adminUserId,
                    content: dto.content,
                    sentVia: dto.channel ?? ReplyChannel.EMAIL,
                },
            })

            await tx.contactMessage.update({
                where: { id: messageId },
                data: {
                    status: MessageStatus.REPLIED,
                    repliedAt: new Date(),
                    lastRepliedById: adminUserId,
                },
            })

            return reply
        })
    }
}
