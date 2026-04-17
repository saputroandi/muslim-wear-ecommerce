import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateOrderStatusDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  status!: string;

  @IsOptional()
  @IsString()
  _csrf?: string;
}
