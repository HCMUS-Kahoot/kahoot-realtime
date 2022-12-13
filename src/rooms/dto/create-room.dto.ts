import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @Transform((value) => value.toString())
  hostId: string;

  // @IsString()
  // @IsNotEmpty()
  // @Transform((value) => value.toString())
  // pin: string;
}
