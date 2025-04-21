// Imports
import { StrService } from './string';
import { Module } from '@nestjs/common';

@Module({ exports: [StrService], providers: [StrService] })
export class UtilsModule {}
