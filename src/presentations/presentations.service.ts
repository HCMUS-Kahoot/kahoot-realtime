import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';

@Injectable()
export class PresentationsService {

  private readonly logger = new Logger(PresentationsService.name);
  constructor(private readonly httpService: HttpService) { }

  create(createPresentationDto: CreatePresentationDto) {
    return 'This action adds a new presentation';
  }

  findAll() {
    return `This action returns all presentations`;
  }

  async findOne(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/slides/getSlidesByPresentationId/${id}`),
      );
      this.logger.log(`response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, error.status);
    }
  }

  async endAndSavePresentation(data) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/presentationSessions`, data),
      );
      this.logger.log(`response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, error.status);
    }
  }
  async getGroupIdByPresentationId(presentationId) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/presentations/${presentationId}`),
      );
      this.logger.log(`response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, error.status);
    }
  }
  update(id: number, updatePresentationDto: UpdatePresentationDto) {
    return `This action updates a #${id} presentation`;
  }

  remove(id: number) {
    return `This action removes a #${id} presentation`;
  }
  async getRoleInGroup(groupId: any, userId: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/group-members/${groupId}/${userId}`),
      );
      this.logger.log(`response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      return null;
    }
  }
}
