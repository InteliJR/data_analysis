import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health') // Cria o endpoint /health
  @HttpCode(HttpStatus.OK) // Garante que ele sempre retorne 200 OK
  healthCheck() {
    return { status: 'ok' };
  }
}
