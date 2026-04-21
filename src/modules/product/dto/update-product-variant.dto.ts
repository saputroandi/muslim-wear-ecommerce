import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { PRODUCT_SIZES, type ProductSize } from "../entities/product-variant.entity";

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  _csrf?: string;

  @IsOptional()
  @IsIn(PRODUCT_SIZES)
  size?: ProductSize;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reserved?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  variantPriceCents?: number;
}
