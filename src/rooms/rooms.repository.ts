import { Injectable, Logger } from '@nestjs/common';
import { NotAcceptableException } from '@nestjs/common/exceptions/not-acceptable.exception';
import { ConfigService } from '@nestjs/config';
import { ROOM_DURATION } from '../constant';
import { createRoomID, createRoomPIN, createUserID } from './id-generator';

@Injectable()
export class RoomsRepository {
  private readonly ttl: string; // Time to live
  private readonly logger = new Logger(RoomsRepository.name);
  private rooms = [];
  constructor(configService: ConfigService) {
    this.ttl = configService.get(ROOM_DURATION);
  }

  async create(createRoomDto) {
    try {
      this.logger.log(`createRoomDto: ${createRoomDto}`);
      const room = {
        id: createRoomID(),
        host: {
          hostId: createRoomDto.hostId,
          clientHostId: createRoomDto.clientHostId,
          chats: [],
          questions: [],
        },
        presentation: {
          presentation: createRoomDto.presentation,
          slide: 0,
        },
        pin: createRoomPIN(),
        users: [],
      };
      this.rooms.push(room);
      return room;
    } catch (error) {
      throw new Error(`Error in create room: ${error.message}`);
    }
  }

  findAll() {
    return `This action returns all rooms`;
  }

  findOne(id: string) {
    try {
      const room = this.rooms.find((room) => room.id === id);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${id} not found`);
      }
      return room;
    } catch (error) {
      throw new Error(`Error in find room by id: ${error.message}`);
    }
  }
  findByPin(pin: string) {
    try {
      const room = this.rooms.find((room) => room.pin === pin);
      if (!room) {
        throw new NotAcceptableException(`Room with pin ${pin} not found`);
      }
      return room;
    } catch (error) {
      throw new Error(`Error in find room by pin: ${error.message}`);
    }
  }

  addUserToRoom(roomId: string, user) {
    try {
      this.logger.log(`addUserToRoom: ${roomId} - ${user}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      if (user.id) {
        const userExists = room.users.find((u) => u.id === user.id);
        if (userExists) {
          throw new NotAcceptableException(
            `User with id ${user.id} already exists`,
          );
        }
      } else {
        user.id = user.id || createUserID();
      }
      if (user.role?.toLowerCase() === 'host') {
        room.host.push(user);
      } else {
        room.users.push({
          id: user.id,
          name: user.name,
          clientId: user.clientId,
          answer: [],
          chats: [],
          questions: [],
          votes: [],
        });
      }
      return room;
    } catch (error) {
      throw new Error(`Error in add user to room: ${error.message}`);
    }
  }

  submitAnswer(roomId: string, user) {
    try {
      this.logger.log(`submitAnswer: ${roomId} - ${user}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      const userExists = room.users.find((u) => u.id === user.id);
      if (!userExists) {
        throw new NotAcceptableException(`User with id ${user.id} not found`);
      }
      userExists.answer.push({
        choice: user.answer,
        slideIndex: user.slideIndex,
      });
      return room;
    } catch (error) {
      throw new Error(`Error in submit answer: ${error.message}`);
    }
  }

  update(id: number, updateRoomDto: any) {
    return `This action updates a #${id} room`;
  }

  removeClient(clientId: string) {
    try {
      this.rooms = this.rooms.filter((room) => {
        room.users = room.users.filter((user) => user.clientId !== clientId);
        return room;
      }
      );
    } catch (error) {
      throw new Error(`Error in remove room: ${error.message}`);
    }
  }

  changeSlide(roomId: string, slide: number) {
    try {
      this.logger.log(`changeSlide: ${roomId} - ${slide}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      room.presentation.slide = slide;
      return room;
    } catch (error) {
      throw new Error(`Error in change slide: ${error.message}`);
    }
  }
  userPublicChat(roomId: string, user) {
    try {
      this.logger.log(`userPublicChat: ${roomId} - ${user}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      let userExists = room.users.find((u) => u.id === user.id);
      userExists =
        userExists || (room.host.hostId === user.id ? room.host : null);
      if (!userExists) {
        throw new NotAcceptableException(`User with id ${user.id} not found`);
      }
      userExists.chats.push({
        message: user.message,
        time: Date.now(),
      });
      return room;
    } catch (error) {
      throw new Error(`Error in user public chat: ${error.message}`);
    }
  }
}
