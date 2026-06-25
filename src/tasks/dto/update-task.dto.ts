import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
