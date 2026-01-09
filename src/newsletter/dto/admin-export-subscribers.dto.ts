import { IsBooleanString, IsOptional } from 'class-validator';

export class AdminExportSubscribersDto {
  @IsOptional()
  @IsBooleanString()
  active?: string;
}
