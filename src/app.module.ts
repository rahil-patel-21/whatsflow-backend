import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { PgModule } from './database/pg/pg.module';
import { AuthModule } from './auth/auth.module';
import { UtilsModule } from './utils/utils.module';
import { ThirdPartyModule } from './thirdParty/thirdparty.module';

@Module({
  imports: [AuthModule, PgModule, ChatModule, ThirdPartyModule, UtilsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
