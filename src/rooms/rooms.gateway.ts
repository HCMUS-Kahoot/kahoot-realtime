import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Namespace, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ParticipantDto } from './dto/participant-dto';
// import { SocketWithAuth } from './types';
@UsePipes(new ValidationPipe())
@WebSocketGateway({
  namespace: 'rooms',
}) // implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
export class RoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RoomsGateway.name);
  @WebSocketServer() io: Namespace;
  constructor(private readonly roomsService: RoomsService) { }
  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  handleConnection(client: Socket) {
    const sockets = this.io.sockets;

    this.logger.log(`WS Client with id: ${client.id} connected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);

    this.io.emit('hello', `from ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const sockets = this.io.sockets;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  }

  @SubscribeMessage('createRoom')
  async create(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`createRoom: ${JSON.stringify(createRoomDto)}`);
    try {
      const room = await this.roomsService.create({
        ...createRoomDto,
        clientHostId: client.id,
      });
      client.join(room.id);
      this.io.to(room.id).emit('room_updated', room);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('joinRoom')
  async findOne(
    @MessageBody() user: ParticipantDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomsService.addUserToRoomByPin({
        ...user,
        id: client.id,
      });
      client.join(room.id);
      this.io.to(room.id).emit('room_updated', room);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('submitAnswer')
  async submit(
    @MessageBody() data: { answer: any; slideIndex: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomsService.submitAnswer(data.roomId, {
        id: client.id,
        answer: data.answer,
        slideIndex: data.slideIndex,
      });
      this.io.to(room.id).emit('room_updated', room);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('changeSlide')
  async changeSlide(
    @MessageBody() data: { slide: number; roomId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const room = await this.roomsService.changeSlide(data.roomId, data.slide);
      this.io.to(room.id).emit('room_updated', room);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }
}
