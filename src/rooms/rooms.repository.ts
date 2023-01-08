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
      // check if room with presentationId exists already return that room
      const existedRoom = this.rooms.find(
        (room) => room.presentation.presentationId === createRoomDto.presentationId,
      );

      if (existedRoom) {
        existedRoom.host.hostId = createRoomDto.hostId;
        existedRoom.host.clientHostId = createRoomDto.clientHostId;
        return existedRoom;
      }
      const room = {
        id: createRoomID(),
        host: {
          hostId: createRoomDto.hostId,
          clientHostId: createRoomDto.clientHostId,
          name: createRoomDto.name || 'Host',
          chats: [],
          questions: [],
        },
        presentation: {
          presentationId: createRoomDto.presentationId,
          presentation: createRoomDto.presentation,
          slide: 0,
        },
        pin: createRoomPIN(),
        users: [],
        chats: [],
        questions: [],
        startTime: new Date().getTime(),
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

  removeClient(clientId: string): any {
    try {
      const roomUpdated = [];
      this.rooms = this.rooms.filter((room) => {
        room.users = room.users.filter((user) => {
          if (user.clientId === clientId) {
            roomUpdated.push(room);
            return false;
          }
          return true;
        });
        return true;
      });
      return roomUpdated;
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
      const newMessage = {
        userId: user.id,
        name: userExists.name,
        message: user.message,
        time: Date.now(),
      };
      console.log(userExists);
      room.chats.push(newMessage);
      return newMessage;
    } catch (error) {
      throw new Error(`Error in user public chat: ${error.message}`);
    }
  }

  addQuestion(roomId: any, question: any) {
    try {
      this.logger.log(`addQuestion: ${roomId} - ${question}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      let userExists = room.users.find((u) => u.id === question.userId);
      userExists =
        userExists || (room.host.hostId === question.userId ? room.host : null);

      const newQuestion = {
        question: question.question,
        time: Date.now(),
        questionId: createUserID(),
        voted: [],
        userId: question.userId,
        read: false,
      };

      room.questions.push(newQuestion);
      return newQuestion;
    } catch (error) {
      throw new Error(`Error in add question: ${error.message}`);
    }
  }

  voteQuestion(roomId: any, question: any) {
    try {
      this.logger.log(`voteQuestion: ${roomId} - ${JSON.stringify(question)}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      let userExists = room.users.find((u) => u.id === question.userId);
      userExists =
        userExists || (room.host.hostId === question.userId ? room.host : null);
      if (!userExists) {
        throw new NotAcceptableException(
          `User with id ${question.userId} not found`,
        );
      }
      const newQuestion = room.questions.find(
        (q) => q.questionId === question.questionId,
      );
      if (newQuestion.voted.includes(question.userIdVote)) {
        newQuestion.voted.splice(
          newQuestion.voted.indexOf(question.userIdVote),
          1,
        );
      } else {
        newQuestion.voted.push(question.userIdVote);
      }
      return newQuestion;
    } catch (error) {
      throw new Error(`Error in vote question: ${error.message}`);
    }
  }

  markAsReadQuestion(roomId: any, questionId) {
    try {
      this.logger.log(`removeQuestion: ${roomId} - ${questionId}`);
      const room = this.rooms.find((room) => room.id === roomId);
      if (!room) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      const newQuestions = room.questions.find(
        (q) => q.questionId === questionId,
      );
      newQuestions.read = true;
      return newQuestions;
    } catch (error) {
      throw new Error(`Error in remove question: ${error.message}`);
    }
  }

  getPresentationInRoom(presentationId: any) {
    try {
      const room = this.rooms.find(
        (room) => room.presentation.presentationId === presentationId,
      );
      if (!room) {
        throw new NotAcceptableException(
          `Room with id ${presentationId} not found`,
        );
      }
      return room.presentation;
    } catch (error) {
      throw new Error(`Error in get presentation: ${error.message}`);
    }
  }
  removeRoom(roomId: string): any {
    try {
      const roomRemoved = [];
      this.rooms = this.rooms.filter((room) => {
        if (room.id === roomId) {
          roomRemoved.push(room);
          return false;
        }
        return true;
      });
      if (roomRemoved.length === 0) {
        throw new NotAcceptableException(`Room with id ${roomId} not found`);
      }
      return roomRemoved[0];
    } catch (error) {
      throw new Error(`Error in remove room: ${error.message}`);
    }
  }
}
