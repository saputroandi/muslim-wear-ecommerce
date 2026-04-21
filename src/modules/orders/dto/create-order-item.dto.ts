import { Type } from "class-transformer";
import { IsInt, IsUUID, Min } from "class-validator";

export class CreateOrderItemDto {
  @IsUUID()
  variantId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
