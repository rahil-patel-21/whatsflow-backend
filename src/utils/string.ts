// Imports
import { Injectable } from '@nestjs/common';

@Injectable()
export class StrService {
  generateOTP(length: number = 4): string {
    if (length <= 0) throw new Error('OTP length must be greater than 0.');

    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10); // Random digit (0-9)
    }
    return otp;
  }
}
