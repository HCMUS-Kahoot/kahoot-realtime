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

    this.logger.log(`presentation: ${presentation}`);
    if (!presentation) {
      throw new NotFoundException(
        `Presentation with id ${createRoomDto.presentationId} not found`,
      );
    }

    return this.roomsRepository.create({ ...createRoomDto, presentation });
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

  remove(id: number) {
    return `This action removes a #${id} room`;
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

}
