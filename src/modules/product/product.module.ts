import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { Product } from "./entities/product.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { CategoryController } from "./controllers/category.controller";
import { CategoryService } from "./services/category.service";

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product, ProductVariant])],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class ProductModule {}
