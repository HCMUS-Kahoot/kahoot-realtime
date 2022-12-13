import { PresentationsModule } from './../presentations/presentations.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsRepository } from './rooms.repository';

@Module({
  imports: [
    ConfigModule,
    PresentationsModule,
  ],
  providers: [RoomsGateway, RoomsService, RoomsRepository]
})
export class RoomsModule { }
