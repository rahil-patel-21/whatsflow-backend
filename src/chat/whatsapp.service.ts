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
import { PgService } from 'src/database/pg/pg.service';
import { ChannelTable } from 'src/database/pg/entities/channel.entities';
import { raiseBadRequest, raiseParamMissing } from 'src/config/error';

let client: Client;

type WAHandler = {
  [key: string]: {
    client: Client;
    info: {
      is_active: boolean;
      session_expire_time: Date;
      recent_chats: any[];
    };
  };
};
const wa_handler: WAHandler = {};

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

const media_data = {};

let active_source: string = '';

let is_puppy_loaded = false;

@Injectable()
export class WhatsAppService implements OnModuleInit {
  constructor(private readonly pg: PgService) {}

  onModuleInit() {
    this.syncChannelsForPupeteer();
  }

  async requestCode(
    country_code: string,
    mobile_number: string,
    org_id: string,
  ) {
    if (wa_handler[country_code + mobile_number]) {
      return { code: null, isAuthCompleted: true };
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: mobile_number,
        dataPath: 'session_data',
      }),
      puppeteer: puppeteerConfig,
    });

    return new Promise((resolve, reject) => {
      let pairingCodeRequested = false;
      let isResolved = false; // This ensures only one resolve or reject happens

      client.on('qr', async () => {
        if (!pairingCodeRequested && !isResolved) {
          pairingCodeRequested = true;
          try {
            const pairingCode = await client.requestPairingCode(
              country_code + mobile_number,
            );
            isResolved = true;
            resolve({ code: pairingCode, isAuthCompleted: false });
          } catch (err) {
            isResolved = true;
            reject(err);
          }
        }
      });

      client.on('auth_failure', (msg) => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`Authentication failed: ${msg}`));
        }
      });

      client.on('ready', async () => {
        client.pupPage?.on('pageerror', function (err: Error) {
          console.log('Page error: ' + err.toString());
        });
        client.pupPage?.on('error', function (err: Error) {
          console.log('Page error: ' + err.toString());
        });

        wa_handler[country_code + mobile_number] = {
          client,
          info: {
            is_active: true,
            session_expire_time: null,
            recent_chats: [],
          },
        };
        this.preFillRecentChats(
          client,
          country_code + mobile_number,
          org_id,
        ).catch((err) => {
          console.log({ err });
        });
        this.notifyInitChannel({
          code_response: { isAuthCompleted: true },
          country_code,
          mobile_number,
          org_id,
        }).catch((err) => {
          console.log({ err });
        });

        this.syncChannelInDB(mobile_number, country_code, org_id).catch(
          (err) => {
            console.log({ err });
          },
        );

        if (!isResolved) {
          isResolved = true;
          resolve({ code: null, isAuthCompleted: true });
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
            content:
              msg.type == 'image' ? 'Image Attachment' : (msg?.body ?? ''),
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
            unReadCounts:
              (wa_handler[mobile_number].info.recent_chats[source]
                ?.unReadCounts ?? 0) + 1,
          };

          wa_handler[mobile_number].info.recent_chats[source] = recentChat;
        } catch (error) {}
      });

      client.initialize();
    });
  }

  private async notifyInitChannel(reqData) {
    const firebase_ref = await firestore_db
      .collection('Init-Channels')
      .doc(reqData.org_id)
      .collection('mobile_number')
      .doc(`${reqData.country_code}${reqData.mobile_number}`);

    if (reqData.code_response.isAuthCompleted) {
      this.notifyLoadingChats(
        reqData.org_id,
        `${reqData.country_code}${reqData.mobile_number}`,
        true,
      ).catch((err) => {
        console.log({ err });
      });
    }

    const existing_data = (await firebase_ref.get()).data();
    if (!existing_data) {
      await firebase_ref.create({
        code: reqData.code_response.code,
        isAuthCompleted: reqData.code_response.isAuthCompleted,
        updatedAt: new Date().toJSON(),
      });
    } else {
      const updateData = {
        code: reqData.code_response.code,
        isAuthCompleted: reqData.code_response.isAuthCompleted,
        updatedAt: new Date().toJSON(),
      };
      if (!updateData.code) delete updateData.code;
      await firebase_ref.update(updateData);
    }
  }

  private async notifyLoadingChats(
    org_id: string,
    mobile_number: string,
    is_loading: boolean,
  ) {
    const firebase_ref = await firestore_db
      .collection('loading-chat')
      .doc(org_id)
      .collection('mobile_number')
      .doc(mobile_number);
    const existing_data = (await firebase_ref.get()).data();

    if (!existing_data) {
      await firebase_ref.create({
        is_loading,
        updatedAt: new Date().toJSON(),
      });
    } else {
      await firebase_ref.update({
        is_loading,
        updatedAt: new Date().toJSON(),
      });
    }
  }

  private async syncChannelInDB(
    mobile_number: string,
    country_code: string,
    org_id: string,
  ) {
    try {
      const existing_data = await this.pg.findOne(ChannelTable, {
        attributes: ['is_active'],
        where: { mobile_number },
      });
      // Update existing data
      if (existing_data) {
        if (existing_data.is_active != true) {
          await this.pg.update(
            ChannelTable,
            { is_active: true },
            { where: { mobile_number } },
          );
        }
      }
      // Create new data
      else {
        await this.pg.create(ChannelTable, {
          mobile_number,
          country_code,
          org_id,
          is_active: true,
        });
      }
    } catch (error) {
      console.log({ error });
    }
  }

  private async syncChannelsForPupeteer() {
    if (is_puppy_loaded) {
      return {};
    }
    is_puppy_loaded = true;

    const target_numbers = await this.pg.findAll(ChannelTable, {
      attributes: ['country_code', 'mobile_number', 'org_id'],
      where: { is_active: true },
    });

    for (let index = 0; index < target_numbers.length; index++) {
      try {
        const data: ChannelTable = target_numbers[index];
        this.requestCode(data.country_code, data.mobile_number, data.org_id)
          .then(async (res: any) => {
            if (res.isAuthCompleted == false) {
              await this.pg.update(
                ChannelTable,
                { is_active: false },
                { where: { mobile_number: data.mobile_number } },
              );
            } else {
              console.log('Connected -> ', data.mobile_number);
            }
          })
          .catch((err) => {
            console.log({ err });
          });
      } catch (error) {
        console.log(error);
      }
    }
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
      const mobile_number = body.mobile_number;
      const isRegistered = await this.getClient(mobile_number).isRegisteredUser(
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
    const mobile_number = body.mobile_number;
    const isRegistered = await this.isRegistered({ mobile_number, number });
    if (isRegistered?.isRegistered != true) return isRegistered;

    if (number.length == 10) {
      number = `91${number}@c.us`;
    }

    const text = body?.text ?? '';

    const msg: any = await this.getClient(mobile_number).sendMessage(
      number,
      text,
    );

    const contact = await this.getClient(mobile_number).getContactById(msg?.to);
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
      profilePic: await this.getClient(mobile_number).getProfilePicUrl(msg?.to),
      source: (msg?.to ?? '')?.replace('@c.us', ''),
      timestamp: msg?.timestamp * 1000,
      type: msg?.type ?? '',
      unReadCounts: 0,
    };
    wa_handler[body.mobile_number].info.recent_chats[recentChat.source] =
      recentChat;

    return {};
  }

  async sendMedia(
    chatId: string,
    mediaPath: string,
    caption: string = '',
    mobile_number: string = '',
  ) {
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

    if (wa_handler[mobile_number].info.recent_chats[chatId.slice(-10)]) {
      wa_handler[mobile_number].info.recent_chats[
        chatId.slice(-10)
      ].unReadCounts = 0;
    }

    return { response };
  }

  private async preFillRecentChats(client, mobile_number, org_id) {
    const chats = await client.getChats();

    for (let index = 0; index < chats.length; index++) {
      try {
        const chatData = chats[index];

        const lastMsg: any = chatData.lastMessage ?? {};
        const last_msg_type = lastMsg.type ?? '';

        const last_msg_content = lastMsg.body ?? '';

        const from = (lastMsg?.from ?? '').replace('@c.us', '');
        const to = (lastMsg?.to ?? '').replace('@c.us', '');
        const source = chatData.isGroup
          ? chatData.id_serialized
          : from.includes(Env.wa.number)
            ? to
            : from;

        const contact =
          chatData.isGroup || !chatData.lastMessage
            ? {}
            : await lastMsg.getContact();
        const contactId = contact.id?._serialized ?? '0@c.us';
        const profilePic =
          contactId == '0@c.us' ? '' : await client.getProfilePicUrl(contactId);

        const recentChat = {
          from,
          content:
            last_msg_type == 'image' ? 'Image Attachment' : last_msg_content,
          deviceType: lastMsg?.deviceType ?? '',
          name: chatData.name ?? '',
          source,
          profilePic: profilePic ?? '',
          timestamp: chatData.timestamp * 1000,
          to,
          unReadCounts: 0,
        };
        wa_handler[mobile_number].info.recent_chats[recentChat.source] =
          recentChat;
      } catch (error) {
        console.log({ error });
      }
    }

    this.notifyLoadingChats(org_id, `${mobile_number}`, false).catch((err) => {
      console.log({ err });
    });
  }

  async recentChats(mobile_number) {
    const finalizedList = [];

    for (const key in wa_handler[mobile_number].info.recent_chats) {
      const value = wa_handler[mobile_number].info.recent_chats[key];
      finalizedList.push(value);
    }

    finalizedList.sort((b, a) => a.timestamp - b.timestamp);

    if (finalizedList.length > 0) {
      active_source = finalizedList[0].source;
    }

    return finalizedList;
  }

  async getChat(chatId: string, mobile_number) {
    if (!chatId) return [];

    const isGrpChat = chatId.endsWith('@g.us');
    const chat = await wa_handler[mobile_number].client.getChatById(
      isGrpChat ? chatId : chatId + '@c.us',
    );
    const messages = await chat.fetchMessages({
      limit: 50,
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

    if (wa_handler[mobile_number].info.recent_chats[chatId]) {
      wa_handler[mobile_number].info.recent_chats[chatId].unReadCounts = 0;
    }

    return finalizedMsgs;
  }

  async contacts(reqData) {
    const mobile_number = reqData.mobile_number;
    if (!mobile_number) {
      raiseParamMissing('mobile_number');
    }
    if (mobile_number.length != 12) {
      raiseBadRequest('Please enter valid mobile number with country code');
    }
    let search_str: string = reqData.search_str;
    if (search_str) {
      search_str = search_str.trim()?.toLowerCase();
    }

    const client = await this.getClient(mobile_number);
    const contacts = await client.getContacts();

    const finalized_list = [];
    for (let index = 0; index < contacts.length; index++) {
      try {
        const contact = contacts[index];
        if (contact.isMyContact == false) {
          continue;
        }

        const verifiedName = contact.verifiedName;
        const shortName = contact.shortName;
        const name = contact.name;

        const contact_name = name ?? verifiedName ?? shortName ?? '';
        const contact_number = contact.number;
        if (contact_number.length > 12) {
          continue;
        }
        const is_business = contact.isBusiness;

        if (search_str?.length > 0) {
          if (
            contact_number.includes(search_str) ||
            contact_name.toLowerCase().includes(search_str)
          ) {
            finalized_list.push({ contact_number, is_business, contact_name });
          }
        } else {
          finalized_list.push({ contact_number, is_business, contact_name });
        }
      } catch (error) {
        console.log(error);
      }
    }

    return {
      success: true,
      count: finalized_list.length,
      rows: finalized_list,
    };
  }

  async setActiveSource(reqData) {
    const source = reqData.source;
    if (!source) return {};

    active_source = source;

    console.log({ active_source });

    return {};
  }

  async disconnect(mobile_number) {
    const client = await this.getClient(mobile_number);
    await client.destroy();
    delete wa_handler[mobile_number];
    await this.pg.update(
      ChannelTable,
      { is_active: false },
      { where: { mobile_number } },
    );
  }

  private getClient(mobile_number: string) {
    return wa_handler[mobile_number].client;
  }
}
