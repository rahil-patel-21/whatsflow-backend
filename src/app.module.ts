import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';

@Module({
  imports: [ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
