// Imports
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  async startConnectionReq(reqData) {
    return { codeSent: true };
  }
}
