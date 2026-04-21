import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { PRODUCT_SIZES, type ProductSize } from "../entities/product-variant.entity";

export class CreateProductVariantDto {
  @IsOptional()
  @IsString()
  _csrf?: string;

  @IsIn(PRODUCT_SIZES)
  size!: ProductSize;

  @IsString()
  @MaxLength(80)
  color!: string;

  @IsString()
  @MaxLength(100)
  sku!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

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
