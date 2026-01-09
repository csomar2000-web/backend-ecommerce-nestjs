@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  // Public contact form
  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.service.create(dto)
  }

  // Admin dashboard
  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id)
  }
}
