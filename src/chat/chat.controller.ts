// Imports
import { ChatService } from './chat.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('startConnectionReq')
  async funStartConnectionReq(@Body() body) {
    return await this.service.startConnectionReq(body);
  }
}
