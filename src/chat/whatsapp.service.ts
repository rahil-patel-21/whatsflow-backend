// Imports
import {
  Client,
  Message,
  MessageAck,
  LocalAuth,
  MessageMedia,
} from 'whatsapp-web.js';
import { Env } from 'src/constant/env';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { firestore_db } from 'src/thirdParty/google/firebase.service';

let client: Client;

export const wa_client = { isConnected: false };

const puppeteerConfig: any =
  process.env?.PUPPETEER_EXECUTABLE_PATH == undefined
    ? { headless: 'new' }
    : {
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      };

const recent_chats = {};
const media_data = {};

@Injectable()
export class WhatsAppService implements OnModuleInit {
  onModuleInit() {
    this.connectClient();
  }

  connectClient() {
    client = new Client({
      authStrategy: new LocalAuth({
        clientId: Env.wa.number,
        dataPath: 'session_data',
      }),
      puppeteer: puppeteerConfig,
    });

    // client initialize does not finish at ready now.
    client.initialize();

    client.on('loading_screen', (percent: number, message: string) => {
      console.log('LOADING SCREEN', percent, message);
    });

    // Pairing code only needs to be requested once
    let pairingCodeRequested = false;
    client.on('qr', async () => {
      // Pairing code
      if (!pairingCodeRequested) {
        const pairingCode = await client.requestPairingCode(
          '91' + Env.wa.number,
        );
        pairingCodeRequested = true;
        console.log('Pairing code enabled, code: ' + pairingCode);
      }
    });

    client.on('authenticated', () => {
      console.log('AUTHENTICATED');
    });

    client.on('auth_failure', (msg: string) => {
      // Fired if session restore was unsuccessful
      console.error('AUTHENTICATION FAILURE', msg);
    });

    client.on('ready', async () => {
      console.log('READY');
      const debugWWebVersion = await client.getWWebVersion();
      console.log(`WWebVersion = ${debugWWebVersion}`);

      client.pupPage?.on('pageerror', function (err: Error) {
        console.log('Page error: ' + err.toString());
      });
      client.pupPage?.on('error', function (err: Error) {
        console.log('Page error: ' + err.toString());
      });

      await this.preFillRecentChats();
      if (!wa_client.isConnected) {
        wa_client.isConnected = true;
        for (
          let index = 0;
          index < Env.wa.whitelisted_numbers.length;
          index++
        ) {
          // this.sendMsg({
          //   number: Env.wa.whitelisted_numbers[index],
          //   text: 'Hey there, WA is connected successfully !',
          // });
        }
      }
    });

    client.on('message', async (msg: any) => {
      if (msg?.type != 'chat' && msg?.type != 'image') return {};

      if (msg.type == 'image') {
        const media = await msg.downloadMedia();
        const base64Data = media.data ?? '';
        const mediaKey = msg.mediaKey;
        media_data[mediaKey] = base64Data;
      }

      const contact = await msg.getContact();
      const contactId = contact.id?._serialized ?? '';
      const profilePic = await client.getProfilePicUrl(contactId);

      try {
        // const creationData = { type: 1, response: msg };
        const source = (msg?.from ?? '')?.replace('@c.us', '');
        const recentChat = {
          content: msg.type == 'image' ? 'Image Attachment' : (msg?.body ?? ''),
          deviceType: msg?.deviceType ?? '',
          from: (msg?.from ?? '')?.replace('@c.us', ''),
          id: msg?.id?.id ?? '',
          name:
            contact?.name ??
            contact?.shortName ??
            contact?.pushname ??
            msg?._data?.notifyName ??
            '',
          profilePic,
          source,
          timestamp: msg?.timestamp * 1000,
          type: msg?.type ?? '',
          unReadCounts: (recent_chats[source]?.unReadCounts ?? 0) + 1,
        };

        this.refreshRecentChat();
        this.refreshMainChat(recentChat.source).catch((err) => {
          console.log({ err });
        });

        recent_chats[source] = recentChat;
      } catch (error) {}
    });

    client.on('message_create', async (msg: Message) => {
      // Fired on all message creations, including your own
      if (msg.fromMe) {
        // Do stuff here
      }
    });

    client.on('message_ciphertext', (msg: Message) => {
      // Receiving new incoming messages that have been encrypted
      // msg.type === 'ciphertext'
      msg.body = 'Waiting for this message. Check your phone.';

      // Do stuff here
    });

    client.on('message_ack', (msg: Message, ack: MessageAck) => {
      /*
            == ACK VALUES ==
            ACK_ERROR: -1
            ACK_PENDING: 0
            ACK_SERVER: 1
            ACK_DEVICE: 2
            ACK_READ: 3
            ACK_PLAYED: 4
        */

      if (ack === 3) {
        // The message was read
      }
    });

    client.on('change_state', (state: string) => {
      console.log('CHANGE STATE', state);
    });

    client.on('disconnected', (reason: string) => {
      console.log('Client was logged out', reason);
    });

    client.on('message_reaction', async (reaction: any) => {
      console.log('REACTION RECEIVED', reaction);
    });

    client.on('vote_update', (vote: any) => {
      /** The vote that was affected: */
      console.log(vote);
    });
  }

  disconnectClient() {
    client.destroy();
    wa_client.isConnected = false;
  }

  async isRegistered(body) {
    try {
      const countryCode = body.countryCode ?? '91';
      const isRegistered = await client.isRegisteredUser(
        countryCode + body?.number,
      );
      return { isRegistered };
    } catch (error) {
      return { isError: true };
    }
  }

  async sendMsg(body) {
    let number = body?.number ?? '';
    if (number.length == 12) {
      number = number.slice(-10);
    }

    const isRegistered = await this.isRegistered({ number });
    if (isRegistered?.isRegistered != true) return isRegistered;

    if (number.length == 10) {
      number = `91${number}@c.us`;
    }
    const text = body?.text ?? '';

    try {
      // const creationData = { type: 2, response: { number, text } };
    } catch (error) {}

    const msg: any = await client.sendMessage(number, text);
    this.refreshMainChat(number.replace('@c.us', '')).catch((err) => {
      console.log(err);
    });

    const contact = await client.getContactById(msg?.to);
    const recentChat = {
      content: msg?.body ?? '',
      deviceType: msg?.deviceType ?? '',
      from: (msg?.from ?? '')?.replace('@c.us', ''),
      id: msg?.id?.id ?? '',
      name:
        contact?.name ??
        contact?.pushname ??
        contact?.shortName ??
        msg?._data?.notifyName ??
        '',
      profilePic: await client.getProfilePicUrl(msg?.to),
      source: (msg?.to ?? '')?.replace('@c.us', ''),
      timestamp: msg?.timestamp * 1000,
      type: msg?.type ?? '',
      unReadCounts: 0,
    };
    recent_chats[recentChat.source] = recentChat;

    this.refreshRecentChat();

    return {};
  }

  async sendMedia(chatId: string, mediaPath: string, caption: string = '') {
    let number = chatId;
    if (number.length == 12) {
      number = number.slice(-10);
    }

    const isRegistered = await this.isRegistered({ number });
    if (isRegistered?.isRegistered != true) return isRegistered;

    if (number.length == 10) {
      number = `91${number}@c.us`;
    }

    const media = MessageMedia.fromFilePath(mediaPath);
    const response = await client.sendMessage(number, media, { caption });

    if (recent_chats[chatId.slice(-10)]) {
      recent_chats[chatId.slice(-10)].unReadCounts = 0;
    }

    return { response };
  }

  private async preFillRecentChats() {
    const chats = await client.getChats();
    for (let index = 0; index < chats.length; index++) {
      try {
        const chatData = chats[index];
        if (chatData.archived == true) continue;

        const lastMsg: any = chatData.lastMessage ?? {};
        const last_msg_type = lastMsg.type ?? '';
        if (last_msg_type != 'chat' && last_msg_type != 'image') continue;
        const last_msg_content = lastMsg.body ?? '';

        const from = (lastMsg?.from ?? '').replace('@c.us', '');
        const to = (lastMsg?.to ?? '').replace('@c.us', '');
        const source = from.includes(Env.wa.number) ? to : from;

        const contact = await lastMsg.getContact();
        const contactId = contact.id?._serialized ?? '';
        const profilePic = await client.getProfilePicUrl(contactId);

        const recentChat = {
          from,
          content:
            last_msg_type == 'image' ? 'Image Attachment' : last_msg_content,
          deviceType: lastMsg?.deviceType ?? '',
          name: chatData.name ?? '',
          source,
          profilePic,
          timestamp: chatData.timestamp * 1000,
          to,
          unReadCounts: 0,
        };
        recent_chats[recentChat.source] = recentChat;
      } catch (error) {}
    }
  }

  async recentChats() {
    const finalizedList = [];

    for (const key in recent_chats) {
      const value = recent_chats[key];
      finalizedList.push(value);
    }

    finalizedList.sort((b, a) => a.timestamp - b.timestamp);

    return finalizedList;
  }

  private async refreshRecentChat() {
    const firebase_ref = await firestore_db
      .collection('Recent-Chats')
      .doc('Default');
    firebase_ref.update({ last_refreshed_at: new Date().getTime() });
  }

  private async refreshMainChat(source) {
    const firebase_ref = await firestore_db
      .collection('Main-Chats')
      .doc(source);
    try {
      firebase_ref.update({ last_refreshed_at: new Date().getTime() });
    } catch (error) {
      firebase_ref.create({ last_refreshed_at: new Date().getTime() });
    }
  }

  async getChat(chatId) {
    if (!chatId) return [];

    const chat = await client.getChatById(chatId + '@c.us');
    const messages = await chat.fetchMessages({
      limit: 100,
    });

    const finalizedMsgs = [];
    for (let index = 0; index < messages.length; index++) {
      const msg = messages[index];

      let base64ImageContent = undefined;
      let caption = undefined;
      if (msg.type == 'image') {
        const mediaKey = msg.mediaKey;
        caption = msg.body;
        if (!media_data[mediaKey]) {
          const media = await msg.downloadMedia();
          const base64Data = media.data ?? '';
          const mediaKey = msg.mediaKey;
          media_data[mediaKey] = base64Data;
          base64ImageContent = `data:image/png;base64,${base64Data}`;
        } else {
          base64ImageContent = `data:image/png;base64,${media_data[mediaKey]}`;
        }
      }

      finalizedMsgs.push({
        caption,
        content: base64ImageContent ?? (msg.body ?? '').replace(/  /g, ' \n\n'),
        deviceType: msg.deviceType ?? '',
        fromMe: msg.fromMe ?? false,
        id: msg.id.id ?? '',
        timestamp: msg.timestamp,
        type: msg.type,
      });
    }

    finalizedMsgs.sort((a, b) => a.timestamp - b.timestamp);

    if (recent_chats[chatId]) {
      recent_chats[chatId].unReadCounts = 0;
    }

    return finalizedMsgs;
  }
}
