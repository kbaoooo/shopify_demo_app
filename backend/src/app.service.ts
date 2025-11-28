import { Get, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  @Get('hello')
  getHello() {
    return { message: 'Hello World!' };
  }
}
