import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import { Category } from "../entities/category.entity";
import { Product } from "../entities/product.entity";
import { ProductVariant, type ProductSize } from "../entities/product-variant.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { CreateProductVariantDto } from "../dto/create-product-variant.dto";
import { UpdateProductVariantDto } from "../dto/update-product-variant.dto";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.assertCategoryExists(createProductDto.categoryId);
    await this.assertProductUniqueness({
      sku: createProductDto.sku,
      slug: createProductDto.slug
    });

    const product = this.productRepository.create({
      ...createProductDto,
      imageUrl: createProductDto.imageUrl ?? null,
      description: createProductDto.description ?? null,
      isActive: createProductDto.isActive ?? true
    });

    return this.productRepository.save(product);
  }

  async findAll(filters?: { categoryId?: string; isActive?: boolean }): Promise<Product[]> {
    const query = this.productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category")
      .leftJoinAndSelect("product.variants", "variant")
      .orderBy("product.created_at", "DESC");

    if (filters?.categoryId) {
      query.andWhere("product.category_id = :categoryId", { categoryId: filters.categoryId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere("product.is_active = :isActive", { isActive: filters.isActive });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        category: true,
        variants: true
      }
    });

    if (!product) {
      throw new BadRequestException(`Product ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (typeof updateProductDto.categoryId !== "undefined") {
      await this.assertCategoryExists(updateProductDto.categoryId);
      product.categoryId = updateProductDto.categoryId;
    }

    if (typeof updateProductDto.sku !== "undefined" || typeof updateProductDto.slug !== "undefined") {
      await this.assertProductUniqueness(
        {
          sku: updateProductDto.sku ?? product.sku,
          slug: updateProductDto.slug ?? product.slug
        },
        id
      );
    }

    Object.assign(product, {
      ...updateProductDto,
      description: typeof updateProductDto.description !== "undefined" ? updateProductDto.description ?? null : product.description,
      imageUrl: typeof updateProductDto.imageUrl !== "undefined" ? updateProductDto.imageUrl ?? null : product.imageUrl
    });

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.productRepository.delete(id);
  }

  async addVariant(productId: string, variantData: CreateProductVariantDto): Promise<ProductVariant> {
    await this.findOne(productId);
    await this.assertVariantUniqueness({
      productId,
      sku: variantData.sku,
      size: variantData.size,
      color: variantData.color
    });

    const variant = this.variantRepository.create({
      productId,
      size: variantData.size,
      color: variantData.color,
      sku: variantData.sku,
      stock: variantData.stock,
      reserved: variantData.reserved ?? 0,
      variantPriceCents: variantData.variantPriceCents ?? null
    });

    return this.variantRepository.save(variant);
  }

  async updateVariant(variantId: string, variantData: UpdateProductVariantDto): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) {
      throw new BadRequestException(`Variant ${variantId} not found`);
    }

    const nextSku = variantData.sku ?? variant.sku;
    const nextSize = variantData.size ?? variant.size;
    const nextColor = variantData.color ?? variant.color;

    if (nextSku !== variant.sku || nextSize !== variant.size || nextColor !== variant.color) {
      await this.assertVariantUniqueness({
        productId: variant.productId,
        sku: nextSku,
        size: nextSize,
        color: nextColor
      }, variantId);
    }

    Object.assign(variant, {
      ...variantData,
      variantPriceCents: typeof variantData.variantPriceCents !== "undefined" ? variantData.variantPriceCents ?? null : variant.variantPriceCents
    });

    return this.variantRepository.save(variant);
  }

  async removeVariant(variantId: string): Promise<void> {
    const variant = await this.variantRepository.findOne({ where: { id: variantId } });
    if (!variant) {
      throw new BadRequestException(`Variant ${variantId} not found`);
    }

    await this.variantRepository.delete(variantId);
  }

  async reserveStock(variantId: string, quantity: number, queryRunner?: QueryRunner): Promise<void> {
    this.assertPositiveQuantity(quantity);
    const repo = this.getVariantRepository(queryRunner);
    const variant = await repo.findOne({ where: { id: variantId } });

    if (!variant) {
      throw new BadRequestException(`Variant ${variantId} not found`);
    }

    const available = variant.stock - variant.reserved;
    if (available < quantity) {
      throw new BadRequestException(`Insufficient stock for variant ${variantId}. Available: ${available}, Requested: ${quantity}`);
    }

    variant.reserved += quantity;
    await repo.save(variant);
  }

  async releaseStock(variantId: string, quantity: number, queryRunner?: QueryRunner): Promise<void> {
    this.assertPositiveQuantity(quantity);
    const repo = this.getVariantRepository(queryRunner);
    const variant = await repo.findOne({ where: { id: variantId } });

    if (!variant) {
      throw new BadRequestException(`Variant ${variantId} not found`);
    }

    variant.reserved = Math.max(0, variant.reserved - quantity);
    await repo.save(variant);
  }

  async confirmReservedStock(variantId: string, quantity: number, queryRunner?: QueryRunner): Promise<void> {
    this.assertPositiveQuantity(quantity);
    const repo = this.getVariantRepository(queryRunner);
    const variant = await repo.findOne({ where: { id: variantId } });

    if (!variant) {
      throw new BadRequestException(`Variant ${variantId} not found`);
    }

    if (variant.reserved < quantity || variant.stock < quantity) {
      throw new BadRequestException(`Insufficient reserved stock for variant ${variantId}. Requested: ${quantity}`);
    }

    variant.stock -= quantity;
    variant.reserved -= quantity;
    await repo.save(variant);
  }

  private getVariantRepository(queryRunner?: QueryRunner): Repository<ProductVariant> {
    return queryRunner ? queryRunner.manager.getRepository(ProductVariant) : this.variantRepository;
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException(`Category ${categoryId} not found`);
    }
  }

  private async assertProductUniqueness(
    values: { sku: string; slug: string },
    productId?: string
  ): Promise<void> {
    const existing = await this.productRepository.findOne({
      where: [
        { sku: values.sku },
        { slug: values.slug }
      ]
    });

    if (!existing) {
      return;
    }

    if (productId && existing.id === productId) {
      return;
    }

    if (existing.sku === values.sku) {
      throw new BadRequestException(`SKU ${values.sku} already exists`);
    }

    if (existing.slug === values.slug) {
      throw new BadRequestException(`Slug ${values.slug} already exists`);
    }
  }

  private async assertVariantUniqueness(
    values: { productId: string; sku: string; size: ProductSize; color: string },
    variantId?: string
  ): Promise<void> {
    const existing = await this.variantRepository.findOne({
      where: [
        { sku: values.sku },
        { productId: values.productId, size: values.size, color: values.color }
      ]
    });

    if (!existing) {
      return;
    }

    if (variantId && existing.id === variantId) {
      return;
    }

    if (existing.sku === values.sku) {
      throw new BadRequestException(`SKU ${values.sku} already exists`);
    }

    throw new BadRequestException(`Variant for ${values.size}/${values.color} already exists for product ${values.productId}`);
  }

  private assertPositiveQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException("Quantity must be a positive integer");
    }
  }
}
