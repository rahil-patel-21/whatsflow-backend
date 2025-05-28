// Imports
import { Injectable } from '@nestjs/common';
import { raiseParamMissing } from 'src/config/error';
import { PgService } from 'src/database/pg/pg.service';
import { ChannelTable } from 'src/database/pg/entities/channel.entities';
import { WhatsAppService } from 'src/chat/whatsapp.service';

@Injectable()
export class OrgService {
  constructor(
    private readonly pg: PgService,
    private readonly wa: WhatsAppService,
  ) {}

  async channels(reqData) {
    const org_id = reqData.org_id;
    if (!org_id) {
      raiseParamMissing('org_id');
    }

    const channels = await this.pg.findAll(ChannelTable, { where: { org_id } });

    return { success: true, data: channels };
  }

  async initChannel(reqData) {
    const org_id = reqData.org_id;
    if (!org_id) {
      raiseParamMissing('org_id');
    }

    const mobile_number = reqData.mobile_number;
    if (!mobile_number) {
      raiseParamMissing('mobile_number');
    }

    const country_code = reqData.country_code;
    if (!country_code) {
      raiseParamMissing('country_code');
    }

    const code_response = await this.wa.requestCode(
      country_code,
      mobile_number,
    );

    return {
      success: true,
      data: code_response,
      message: 'Code generated successfully !',
    };
  }
}
