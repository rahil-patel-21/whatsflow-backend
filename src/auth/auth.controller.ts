// Imports
import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('signUp')
  async funSignUp(@Body() body) {
    return await this.service.signUp(body);
  }

  @Post('validateOTP')
  async funValidateOTP(@Body() body) {
    return await this.service.validateOTP(body);
  }

  @Post('resendOTP')
  async funResendOTP(@Body() body) {
    return await this.service.resendOTP(body);
  }

  @Post('forgotPasswordOTP')
  async funForgotPasswordOTP(@Body() body) {
    return await this.service.forgotPasswordOTP(body);
  }

  @Post('validateForgotPasswordOTP')
  async funValidateForgotPasswordOTP(@Body() body) {
    return await this.service.validateForgotPasswordOTP(body);
  }

  @Post('signIn')
  async funSignIn(@Body() body) {
    return await this.service.signIn(body);
  }
}
