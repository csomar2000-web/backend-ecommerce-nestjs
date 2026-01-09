import { IsBooleanString, IsOptional } from 'class-validator';

export class AdminListSubscribersDto {
  @IsOptional()
  @IsBooleanString()
  active?: string; 
}
