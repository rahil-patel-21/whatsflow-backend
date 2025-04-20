import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { PgModule } from './database/pg/pg.module';

@Module({
  imports: [PgModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
