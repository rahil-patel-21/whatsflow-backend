// Imports
import { Module } from '@nestjs/common';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';
import { PgModule } from 'src/database/pg/pg.module';
import { WhatsAppService } from 'src/chat/whatsapp.service';

@Module({
  controllers: [OrgController],
  imports: [PgModule],
  providers: [OrgService, WhatsAppService],
})
export class OrgModule {}
