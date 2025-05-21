// Imports
import { Injectable } from '@nestjs/common';
import { StrService } from 'src/utils/string';
import { PgService } from 'src/database/pg/pg.service';
import { UserTable } from 'src/database/pg/entities/user.entities';
import { raiseBadRequest, raiseParamMissing } from 'src/config/error';
import { MailJetService } from 'src/thirdParty/mailjet/mailjet.service';
import { SIGN_UP_OTP_HTML } from 'src/constant/strings';

@Injectable()
export class AuthService {
  constructor(
    private readonly pg: PgService,
    private readonly str: StrService,
    private readonly mailJet: MailJetService,
  ) {}

  async signUp(reqData) {
    const email: string = reqData.email;
    if (!email) {
      raiseParamMissing('email');
    }
    const password: string = reqData.password;
    if (!password) {
      raiseParamMissing('password');
    }

    const userData = await this.pg.findOne(UserTable, { where: { email } });
    if (userData) {
      raiseBadRequest('User already exists !');
    }

    const otp = this.str.generateOTP();
    await this.pg.create(UserTable, {
      email,
      password,
      otp,
    });

    await this.mailJet.sendMail({
      email,
      subject: `Account verification`,
      htmlContent: SIGN_UP_OTP_HTML.replace('OTP_CODE', otp),
    });

    return { success: true, message: 'Account created successfully !' };
  }

  async validateOTP(reqData) {
    const email: string = reqData.email;
    if (!email) {
      raiseParamMissing('email');
    }
    const otp: string = reqData.otp;
    if (!otp) {
      raiseParamMissing('otp');
    }

    const userData = await this.pg.findOne(UserTable, { where: { email } });
    if (!userData) {
      raiseBadRequest('User not found !');
    }
    if (userData.otp != otp) {
      raiseBadRequest('Invalid OTP, Please try again later.');
    }

    return { success: true, message: 'OTP verified successfully !' };
  }

  async resendOTP(reqData) {
    const email: string = reqData.email;
    if (!email) {
      raiseParamMissing('email');
    }

    const userData: UserTable = await this.pg.findOne(UserTable, {
      where: { email },
    });
    if (!userData) {
      raiseBadRequest('User not found !');
    }

    const otp = this.str.generateOTP();
    await this.mailJet.sendMail({
      email,
      subject: `Account verification`,
      htmlContent: SIGN_UP_OTP_HTML.replace('OTP_CODE', otp),
    });

    await this.pg.update(UserTable, { otp }, { where: { id: userData.id } });

    return { success: true, message: 'OTP sent successfully !' };
  }

  async forgotPasswordOTP(reqData) {
    const email: string = reqData.email;
    if (!email) {
      raiseParamMissing('email');
    }

    const userData: UserTable = await this.pg.findOne(UserTable, {
      where: { email },
    });
    if (!userData) {
      raiseBadRequest('User not found !');
    }

    const otp = this.str.generateOTP();
    await this.mailJet.sendMail({
      email,
      subject: `Forgot Password Verification`,
      htmlContent: SIGN_UP_OTP_HTML.replace('OTP_CODE', otp),
    });

    await this.pg.update(UserTable, { otp }, { where: { id: userData.id } });

    return { success: true, message: 'OTP sent successfully !' };
  }

  async validateForgotPasswordOTP(reqData) {
    const email: string = reqData.email;
    if (!email) {
      raiseParamMissing('email');
    }
    const otp: string = reqData.otp;
    if (!otp) {
      raiseParamMissing('otp');
    }
    const password: string = reqData.password;
    if (!password) {
      raiseParamMissing('password');
    }
    if (password.length < 6) {
      raiseBadRequest('Password length should be minimum 6 characters');
    }

    const userData: UserTable = await this.pg.findOne(UserTable, {
      where: { email },
    });
    if (!userData) {
      raiseBadRequest('User not found !');
    }

    if (userData.password == password) {
      raiseBadRequest('Old password and new password can not be same');
    }

    await this.pg.update(
      UserTable,
      { password },
      { where: { id: userData.id } },
    );

    return { success: true, message: 'Password changed successfully !' };
  }

  async signIn(reqData) {
    const email: string = reqData.email;
    if (!email) {
      raiseParamMissing('email');
    }
    const password: string = reqData.password;
    if (!password) {
      raiseParamMissing('password');
    }

    const userData = await this.pg.findOne(UserTable, { where: { email } });
    if (!userData) {
      raiseBadRequest('Email does not exists, Please sign up instead !');
    }
    if (userData.password != password) {
      raiseBadRequest('Invalid credentials, Please try again later !');
    }

    return { success: true, message: 'Sign in successfully !' };
  }
}
