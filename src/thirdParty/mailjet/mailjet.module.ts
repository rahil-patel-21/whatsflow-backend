// Imports
import { Module } from '@nestjs/common';
import { MailJetService } from './mailjet.service';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [UtilsModule],
  exports: [MailJetService],
  providers: [MailJetService],
})
export class MailJetModule {}
