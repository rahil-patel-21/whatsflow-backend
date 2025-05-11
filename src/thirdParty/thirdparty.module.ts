// Imports
import { Module } from '@nestjs/common';
import { MailJetModule } from './mailjet/mailjet.module';

@Module({ imports: [MailJetModule] })
export class ThirdPartyModule {}
