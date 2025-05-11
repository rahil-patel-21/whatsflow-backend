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
}
