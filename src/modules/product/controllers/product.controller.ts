import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminSessionGuard } from "../../auth/admin-session.guard";
import { CreateProductDto } from "../dto/create-product.dto";
import { CreateProductVariantDto } from "../dto/create-product-variant.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { UpdateProductVariantDto } from "../dto/update-product-variant.dto";
import { ProductService } from "../services/product.service";

@Controller("api/admin/products")
@UseGuards(AdminSessionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll(@Query("categoryId") categoryId?: string, @Query("isActive") isActive?: string) {
    return this.productService.findAll({
      categoryId,
      isActive: typeof isActive === "undefined" ? undefined : isActive === "true" || isActive === "1"
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.productService.remove(id);
    return { message: "Product deleted successfully" };
  }

  @Post(":productId/variants")
  addVariant(@Param("productId") productId: string, @Body() variantData: CreateProductVariantDto) {
    return this.productService.addVariant(productId, variantData);
  }

  @Patch("variants/:variantId")
  updateVariant(@Param("variantId") variantId: string, @Body() variantData: UpdateProductVariantDto) {
    return this.productService.updateVariant(variantId, variantData);
  }

  @Delete("variants/:variantId")
  async removeVariant(@Param("variantId") variantId: string) {
    await this.productService.removeVariant(variantId);
    return { message: "Variant deleted successfully" };
  }
}
