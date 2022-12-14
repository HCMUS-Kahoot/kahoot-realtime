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
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://kahoothcmus.netlify.app',
    ],
  },
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
    const roomUpdated = this.roomsService.removeClient(client.id);
    if (roomUpdated?.length > 0) {
      roomUpdated.forEach((room) => {
        this.io.to(room.id).emit('room_updated', room);
      });
    }
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
      this.logger.log(`Room: ${JSON.stringify(room)}`);
      client.join(room.id);
      this.io.to(room.id).emit('room_updated', room);
      if (room.presentation.groupId) {
        this.io.to(room.presentation.groupId).emit('group_listen_room', room);
      }
    } catch (error) {
      this.logger.error(error);
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('groupListenRoom')
  async groupListenRoom(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.join(data.groupId);
      // this.io.to(data.groupId).emit('group_listen_room', data.groupId);
      const roomIsPresenting =
        await this.roomsService.getPresentationInRoomByGroupId(data.groupId);
      if (roomIsPresenting) {
        this.io.to(data.groupId).emit('group_listen_room', roomIsPresenting);
      }
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
        clientId: client.id,
      });
      if (room.presentation.groupId) {
        const member = await this.roomsService.getRoleInGroup(
          room.presentation.groupId,
          user.id,
        );
        if (!member) {
          this.io.to(client.id).emit('error_join_room', {
            message: 'You are not a member of this group',
          });
        }
        client.join(room.id);
        this.io.to(room.id).emit('room_updated', room);
      } else {
        client.join(room.id);
        this.io.to(room.id).emit('room_updated', room);
      }
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('submitAnswer')
  async submit(
    @MessageBody()
    data: { answer: any; slideIndex: string; roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomsService.submitAnswer(data.roomId, {
        id: data.userId,
        clientId: client.id,
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
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomsService.changeSlide(data.roomId, data.slide);
      this.io.to(room.id).emit('room_updated', room);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('publicChat')
  async publicChat(
    @MessageBody() data: { message: string; roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const newMessage = await this.roomsService.publicChat(data.roomId, {
        id: data.userId,
        message: data.message,
      });
      this.io.to(data.roomId).emit('public_chat', newMessage);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('addQuestion')
  async addQuestion(
    @MessageBody() data: { question: string; roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, roomId, question } = data;
    try {
      const newQuestion = await this.roomsService.addQuestion(roomId, {
        userId,
        question,
      });
      this.io.to(roomId).emit('add_question', newQuestion);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('voteQuestion')
  async voteQuestion(
    @MessageBody()
    data: {
      questionId: string;
      roomId: string;
      userId: string;
      userIdVote: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, roomId, questionId, userIdVote } = data;
    try {
      const newQuestion = await this.roomsService.voteQuestion(roomId, {
        userId,
        questionId,
        userIdVote,
      });
      this.io.to(roomId).emit('vote_question', newQuestion);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('markAsReadQuestion')
  async markAsReadQuestion(
    @MessageBody() data: { questionId: string; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, questionId } = data;
    try {
      const newQuestion = await this.roomsService.markAsReadQuestion(
        roomId,
        questionId,
      );
      this.io.to(roomId).emit('mark_as_read_question', newQuestion);
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }

  @SubscribeMessage('endPresentation')
  async endPresentation(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    try {
      const room = await this.roomsService.endAndSaveRoom(roomId);
      this.io.to(roomId).emit('end_presentation', room);
      if (room.presentation.groupId) {
        this.io.to(room.presentation.groupId).emit('group_listen_room', {
          ...room,
          status: 'end',
        });
      }
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }
  @SubscribeMessage('checkUserCanJoinRoom')
  async checkCanJoinRoom(
    @MessageBody() data: { pin: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { pin, userId } = data;
    try {
      const room = await this.roomsService.findOneByPin(pin);
      if (room.presentation.groupId) {
        const userInGroup = await this.roomsService.getRoleInGroup(
          room.presentation.groupId,
          userId,
        );
        if (!userInGroup) {
          this.io.to(client.id).emit('check_user_can_join_room', {
            status: 'ERROR',
            message: "You don't have permission to join this presentation"
          });
        } else {
          this.io.to(client.id).emit('check_user_can_join_room', {
            ...userInGroup,
            presentationId: room.presentation.presentationId,
            pin: room.pin,
            status: 'OK',
          });
        }
      } else {
        this.io.to(client.id).emit('check_user_can_join_room', {
          status: 'OK',
          pin: room.pin,
          message: "This is a public presentation",
        });
      }
    } catch (error) {
      this.io.to(client.id).emit('realtime_error', error.message);
    }
  }
}
