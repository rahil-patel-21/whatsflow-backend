// Imports
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PgService } from 'src/database/pg/pg.service';
import { UtilsModule } from 'src/utils/utils.module';
import { MailJetModule } from 'src/thirdParty/mailjet/mailjet.module';

@Module({
  controllers: [AuthController],
  imports: [MailJetModule, UtilsModule],
  providers: [AuthService, PgService],
})
export class AuthModule {}
