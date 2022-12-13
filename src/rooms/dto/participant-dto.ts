import { IsString, IsNotEmpty } from 'class-validator';

export class ParticipantDto {
  @IsString()
  role: string = 'participant';

  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
