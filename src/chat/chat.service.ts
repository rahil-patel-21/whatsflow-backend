// Imports
import { Injectable } from '@nestjs/common';
import { wa_client, WhatsAppService } from './whatsapp.service';
import { Env } from 'src/constant/env';

@Injectable()
export class ChatService {
  constructor(private readonly waService: WhatsAppService) {}

  async connectionInfo() {
    let isConnected = false;
    isConnected = wa_client.isConnected;
    return { isConnected };
  }

  async connect() {
    if (wa_client.isConnected) {
      return { message: 'WhatsApp number is already connected !' };
    } else {
      this.waService.connectClient();
      return { message: 'WhatsApp number is now connected !' };
    }
  }

  async disconnect() {
    if (!wa_client.isConnected) {
      return { message: 'WhatsApp number is already disconnected !' };
    } else {
      this.waService.disconnectClient();
      return { message: 'WhatsApp number is disconnected successfully !' };
    }
  }

  async sendMsg(reqData) {
    if (!wa_client.isConnected) {
      return {
        message:
          'You can not send msg as the number is disconnected, Please connect and try again',
      };
    }

    const number = reqData.number;
    if (!number) return { message: 'Parameter number is missing' };
    if (typeof number != 'string')
      return { message: 'Parameter number is having invalid value' };
    if (number.length != 10)
      return { message: 'Parameter number is having invalid value' };
    if (!Env.wa.whitelisted_numbers.includes(number))
      return { message: 'Number is not whitelisted' };
    const text = reqData.text;
    if (!text) return { message: 'Parameter text is missing' };
    if (typeof text != 'string')
      return { message: 'Parameter text is having invalid value' };
    if (text.length <= 1)
      return { message: 'Minimum msg length should be 2 characters' };

    this.waService.sendMsg({ number, text });
    return { message: 'Message sent successfully !' };
  }

  async startConnectionReq(reqData) {
    return { codeSent: true };
  }
}
