import { PresentationsService } from './../presentations/presentations.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsRepository } from './rooms.repository';

@Injectable()
export class RoomsService {

  private readonly logger = new Logger(RoomsService.name);
  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly presentationService: PresentationsService,
  ) { }
  async create(createRoomDto) {
    const presentation = await this.presentationService.findOne(
      createRoomDto.presentationId,
    );
    const group = await this.presentationService.getGroupIdByPresentationId(
      createRoomDto.presentationId,
    );
    if (group?.groupId) {
      presentation.groupId = group?.groupId;
    }
    if (group?.name) {
      presentation.name = group?.name;
    }

    this.logger.log(`presentation: ${presentation}`);
    if (!presentation) {
      throw new NotFoundException(
        `Presentation with id ${createRoomDto.presentationId} not found`,
      );
    }

    return this.roomsRepository.create({ ...createRoomDto, presentation });
  }
  markAsReadQuestion(roomId: string, questionId: string) {
    return this.roomsRepository.markAsReadQuestion(roomId, questionId);
  }
  publicChat(roomId: string, arg1: { id: string; message: string; }) {
    return this.roomsRepository.userPublicChat(roomId, arg1);
  }
  findAll() {
    return `This action returns all rooms`;
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  removeClient(clientId: string): any {
    return this.roomsRepository.removeClient(clientId);
  }
  async addUserToRoomByPin(user) {
    const room = await this.roomsRepository.findByPin(user.pin);
    if (!room) {
      throw new NotFoundException(`Room with pin ${user.pin} not found`);
    }
    const roomUpdated = await this.roomsRepository.addUserToRoom(room.id, user);
    return roomUpdated;
  }
  submitAnswer(roomId, user) {
    const room = this.roomsRepository.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }
    const roomUpdated = this.roomsRepository.submitAnswer(roomId, user);
    return roomUpdated;
  }
  async changeSlide(roomId, slide) {
    const room = await this.roomsRepository.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }
    const roomUpdated = await this.roomsRepository.changeSlide(roomId, slide);
    return roomUpdated;
  }

  async addQuestion(roomId, question) {
    const room = await this.roomsRepository.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }
    const roomUpdated = await this.roomsRepository.addQuestion(
      roomId,
      question,
    );
    return roomUpdated;
  }

  async voteQuestion(roomId, question) {
    const room = await this.roomsRepository.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }
    const roomUpdated = await this.roomsRepository.voteQuestion(
      roomId,
      question,
    );
    return roomUpdated;
  }

  async getPresentationInRoom(presentationId) {
    return this.roomsRepository.getPresentationInRoom(presentationId);
  }
  async getPresentationInRoomByGroupId(groupId) {
    return this.roomsRepository.getPresentationInRoomByGroupId(groupId);
  }
  async endAndSaveRoom(roomId) {
    const roomRemoved = this.roomsRepository.removeRoom(roomId);
    const data = {
      userId: roomRemoved.host.hostId,
      presentation: roomRemoved.presentation.presentationId,
      startTime: new Date(roomRemoved.startTime),
      endTime: new Date(),
      joinUser: roomRemoved.users.map((user) => user.id),
      chats: roomRemoved.chats,
      questions: roomRemoved.questions,
      groupId: roomRemoved.groupId,
    };
    this.logger.log(`data: ${JSON.stringify(data)}`);
    await this.presentationService.endAndSavePresentation(data);
    return roomRemoved;
  }
  async getGroupId(id) {
    return await this.presentationService.getGroupIdByPresentationId(id);
  }
}
