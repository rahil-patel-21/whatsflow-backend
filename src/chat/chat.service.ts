// Imports
import { Env } from 'src/constant/env';
import { Injectable } from '@nestjs/common';
import { wa_client, WhatsAppService } from './whatsapp.service';

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
      return {
        isConnected: true,
        message: 'WhatsApp number is already connected !',
      };
    } else {
      this.waService.connectClient();
      return {
        isConnected: true,
        message: 'WhatsApp number is now connected !',
      };
    }
  }

  async disconnect() {
    if (!wa_client.isConnected) {
      return { message: 'WhatsApp number is already disconnected !' };
    } else {
      this.waService.disconnectClient();
      return {
        isDisconnected: true,
        message: 'WhatsApp number is disconnected successfully !',
      };
    }
  }

  async sendMsg(reqData) {
    let number = reqData.number;
    if (!number) return { message: 'Parameter number is missing' };
    if (typeof number != 'string')
      return { message: 'Parameter number is having invalid value' };
    if (number.length != 10 && number.length != 12)
      return { message: 'Parameter number is having invalid value' };
    number = number.slice(-10);
    const text = reqData.text;
    if (!text) return { message: 'Parameter text is missing' };
    if (typeof text != 'string')
      return { message: 'Parameter text is having invalid value' };
    if (text.length <= 1)
      return { message: 'Minimum msg length should be 2 characters' };
    const mobile_number = reqData.mobile_number;
    if (!mobile_number) {
      return { message: 'Parameter mobile_number is missing' };
    }

    this.waService.sendMsg({ mobile_number, number, text });
    return { message: 'Message sent successfully !' };
  }

  async sendMedia(reqData) {
    if (!wa_client.isConnected) {
      return {
        message:
          'You can not send msg as the number is disconnected, Please connect and try again',
      };
    }

    let number = reqData.number;
    if (!number) return { message: 'Parameter number is missing' };
    if (typeof number != 'string')
      return { message: 'Parameter number is having invalid value' };
    if (number.length != 10 && number.length != 12)
      return { message: 'Parameter number is having invalid value' };
    number = number.slice(-10);
    if (!Env.wa.whitelisted_numbers.includes(number))
      return { message: 'Number is not whitelisted' };
    const caption = reqData.caption;
    if (!caption) {
      return { message: 'Parameter caption is missing' };
    }
    const file = reqData.file;

    return await this.waService.sendMedia(number, file.filename, caption);
  }

  async startConnectionReq(reqData) {
    return { codeSent: true };
  }

  async recentChats(reqData) {
    return await this.waService.recentChats(reqData?.mobile_number);
  }

  async getChat(reqData) {
    return await this.waService.getChat(reqData.id, reqData?.mobile_number);
  }

  async setActiveSource(reqData) {
    return await this.waService.setActiveSource(reqData);
  }

  async contacts(reqData) {
    return await this.waService.contacts(reqData);
  }
}
