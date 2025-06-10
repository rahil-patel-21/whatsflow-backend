// Imports
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { WhatsAppService } from './whatsapp.service';
import { PgModule } from 'src/database/pg/pg.module';

@Module({
  controllers: [ChatController],
  imports: [PgModule],
  providers: [ChatService, WhatsAppService],
})
export class ChatModule {}
