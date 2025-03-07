// Imports
import { ChatService } from './chat.service';
import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('connectionInfo')
  async funConnectionInfo() {
    return await this.service.connectionInfo();
  }

  @Post('connect')
  async funConnect() {
    return await this.service.connect();
  }

  @Post('disconnect')
  async funDisconnect() {
    return await this.service.disconnect();
  }

  @Post('sendMsg')
  async funSendMsg(@Body() body) {
    return await this.service.sendMsg(body);
  }

  @Post('startConnectionReq')
  async funStartConnectionReq(@Body() body) {
    return await this.service.startConnectionReq(body);
  }
}
