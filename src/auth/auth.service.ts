// Imports
import { Injectable } from '@nestjs/common';
import { HTTPError, raiseParamMissing } from 'src/config/error';
import { PgService } from 'src/database/pg/pg.service';
import { UserTable } from 'src/database/pg/entities/user.entities';
import { StrService } from 'src/utils/string';

@Injectable()
export class AuthService {
  constructor(
    private readonly pg: PgService,
    private readonly str: StrService,
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

    const userData = await this.pg.findOne(UserTable, {});
    if (userData) {
      throw HTTPError({ message: 'User already exists' });
    }

    await this.pg.create(UserTable, {
      email,
      password,
      otp: this.str.generateOTP(),
    });

    return { reqData };
  }
}
