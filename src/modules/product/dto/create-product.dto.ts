import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on";
  }
  return false;
}

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  sku!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(180)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePriceCents!: number;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  imageUrl?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}
