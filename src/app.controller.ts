import { Controller, Get, Sse } from '@nestjs/common';
import { AppService } from './app.service';
import { interval, map } from 'rxjs';
import { RoomsService } from './rooms/rooms.service';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly roomService: RoomsService,
  ) { }

  @Sse('presentation')
  getPresentation() {
    return interval(5000).pipe(
      map((number) => ({
        data: `Hello World ${number}`,
      })),
    );
  }
}
