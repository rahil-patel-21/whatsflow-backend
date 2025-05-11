// Imports
import { StrService } from './string';
import { Module } from '@nestjs/common';
import { ApiService } from './api.service';

@Module({
  exports: [ApiService, StrService],
  providers: [ApiService, StrService],
})
export class UtilsModule {}
