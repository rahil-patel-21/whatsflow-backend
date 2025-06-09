// Imports
import { Injectable } from '@nestjs/common';
import { raiseParamMissing } from 'src/config/error';
import { PgService } from 'src/database/pg/pg.service';
import { ChannelTable } from 'src/database/pg/entities/channel.entities';
import { WhatsAppService } from 'src/chat/whatsapp.service';
import { firestore_db } from 'src/thirdParty/google/firebase.service';

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
      org_id,
    );

    this.notifyInitChannel({
      code_response,
      org_id,
      country_code,
      mobile_number,
    });

    return {
      success: true,
      data: code_response,
      message: 'Code generated successfully !',
    };
  }

  private async notifyInitChannel(reqData) {
    const firebase_ref = await firestore_db
      .collection('Init-Channels')
      .doc(reqData.org_id)
      .collection('mobile_number')
      .doc(`${reqData.country_code}${reqData.mobile_number}`);

    const existing_data = (await firebase_ref.get()).data();
    if (!existing_data) {
      await firebase_ref.create({
        code: reqData.code_response.code,
        isAuthCompleted: reqData.code_response.isAuthCompleted,
        updatedAt: new Date().toJSON(),
      });
    } else {
      await firebase_ref.update({
        code: reqData.code_response.code,
        isAuthCompleted: reqData.code_response.isAuthCompleted,
        updatedAt: new Date().toJSON(),
      });
    }
  }
}
