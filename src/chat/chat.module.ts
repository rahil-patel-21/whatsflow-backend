// Imports
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, WhatsAppService],
})
export class ChatModule {}
