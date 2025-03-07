// Imports
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Env } from 'src/constant/env';
import { Client, Message, MessageAck, LocalAuth } from 'whatsapp-web.js';

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

      if (!wa_client.isConnected) {
        wa_client.isConnected = true;
        for (
          let index = 0;
          index < Env.wa.whitelisted_numbers.length;
          index++
        ) {
          this.sendMsg({
            number: Env.wa.whitelisted_numbers[index],
            text: 'Hey there, WA is connected successfully !',
          });
        }
      }
    });

    client.on('message', async (msg: Message) => {
      if (msg?.type != 'chat') return {};

      try {
        const creationData = { type: 1, response: msg };
        console.log('creationData', creationData);
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

    const isRegistered = await this.isRegistered({ number });
    if (isRegistered?.isRegistered != true) return isRegistered;

    if (number.length == 10) {
      number = `91${number}@c.us`;
    }
    const text = body?.text ?? '';

    try {
      const creationData = { type: 2, response: { number, text } };
      console.log('creationData', creationData);
    } catch (error) {}

    client.sendMessage(number, text);

    return {};
  }
}
