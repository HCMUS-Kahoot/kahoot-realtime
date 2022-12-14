import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';

@Injectable()
export class PresentationsService {
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
      return response.data;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  update(id: number, updatePresentationDto: UpdatePresentationDto) {
    return `This action updates a #${id} presentation`;
  }

  remove(id: number) {
    return `This action removes a #${id} presentation`;
  }
}
