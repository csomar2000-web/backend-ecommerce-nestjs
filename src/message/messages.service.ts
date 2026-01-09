@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMessageDto) {
    return this.prisma.contactMessage.create({
      data: dto,
    })
  }

  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  findOne(id: string) {
    return this.prisma.contactMessage.findUnique({
      where: { id },
    })
  }

  markAsRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    })
  }

  markAsReplied(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: 'REPLIED',
      },
    })
  }
}
