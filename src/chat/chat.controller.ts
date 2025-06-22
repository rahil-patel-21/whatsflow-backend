// Imports
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { kUploadFileObj } from 'src/constant/objects';

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

  @Post('sendMedia')
  @UseInterceptors(FileInterceptor('file', kUploadFileObj()))
  async funSendMedia(@Body() body, @UploadedFile() file) {
    body.file = file;
    return await this.service.sendMedia(body);
  }

  @Post('startConnectionReq')
  async funStartConnectionReq(@Body() body) {
    return await this.service.startConnectionReq(body);
  }

  @Get('recentChats')
  async funRecentChats(@Query() query) {
    return await this.service.recentChats(query);
  }

  @Get('getChat')
  async funGetChat(@Query() query) {
    return await this.service.getChat(query);
  }

  @Post('setActiveSource')
  async funSetActiveSource(@Body() body) {
    return await this.service.setActiveSource(body);
  }

  @Get('contacts')
  async funContacts(@Query() query) {
    return await this.service.contacts(query);
  }
}
