// Imports
import { OrgService } from './org.service';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('org')
export class OrgController {
  constructor(private readonly service: OrgService) {}

  @Get('channels')
  async funChannels(@Query() query) {
    return await this.service.channels(query);
  }

  @Post('initChannel')
  async funInitChannel(@Body() body) {
    return await this.service.initChannel(body);
  }

  @Post('disconnectChannel')
  async funDisconnectChannel(@Body() body) {
    return await this.service.disconnectChannel(body);
  }
}
