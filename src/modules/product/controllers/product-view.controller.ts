import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards, Render } from "@nestjs/common";
import { type Request, type Response } from "express";
import { AdminSessionGuard } from "../../auth/admin-session.guard";
import { CategoryService } from "../services/category.service";
import { ProductService } from "../services/product.service";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { CreateProductVariantDto } from "../dto/create-product-variant.dto";
import { UpdateProductVariantDto } from "../dto/update-product-variant.dto";
import { type Product } from "../entities/product.entity";
import { type ProductVariant } from "../entities/product-variant.entity";

type AdminSession = {
  csrfToken?: string;
};

type ProductListItemView = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  categoryName: string;
  basePriceLabel: string;
  isActive: boolean;
  statusLabel: string;
  variantsCount: number;
};

type ProductFormView = {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  basePriceCents: number;
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
};

type VariantRowView = ProductVariant & {
  variantPriceLabel: string;
};

@Controller("admin/products")
@UseGuards(AdminSessionGuard)
export class ProductViewController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {}

  @Get()
  @Render("admin/products/list")
  async list(
    @Req() req: Request & { session?: AdminSession },
    @Query("page") page = "1",
    @Query("limit") limit = "10"
  ): Promise<{
    appName: string;
    title: string;
    intro: string;
    csrfToken?: string;
    products: ProductListItemView[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
      previousPage: number | null;
      nextPage: number | null;
    };
  }> {
    const allProducts = await this.productService.findAll();
    const safeLimit = this.parsePositiveInt(limit, 10, 1, 50);
    const totalItems = allProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
    const currentPage = Math.min(Math.max(this.parsePositiveInt(page, 1, 1, totalPages), 1), totalPages);
    const start = (currentPage - 1) * safeLimit;
    const pageItems = allProducts.slice(start, start + safeLimit);

    return {
      appName: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
      title: "Product Catalog Admin",
      intro: "Kelola katalog, status aktif, dan varian produk dari satu dashboard.",
      csrfToken: req.session?.csrfToken,
      products: pageItems.map((product) => this.toProductListItem(product)),
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        limit: safeLimit,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
        previousPage: currentPage > 1 ? currentPage - 1 : null,
        nextPage: currentPage < totalPages ? currentPage + 1 : null
      }
    };
  }

  @Get("new")
  @Render("admin/products/form")
  async newForm(@Req() req: Request & { session?: AdminSession }) {
    return this.buildFormViewModel({
      pageTitle: "Tambah Produk",
      intro: "Isi data produk utama dan simpan untuk mulai menambahkan varian.",
      action: "/admin/products",
      submitLabel: "Simpan Produk",
      product: this.emptyProduct(),
      csrfToken: req.session?.csrfToken,
      isEdit: false
    });
  }

  @Get(":id/edit")
  @Render("admin/products/form")
  async editForm(@Param("id") id: string, @Req() req: Request & { session?: AdminSession }) {
    const product = await this.productService.findOne(id);
    return this.buildFormViewModel({
      pageTitle: "Edit Produk",
      intro: "Perbarui data produk tanpa mengubah struktur katalog yang sudah ada.",
      action: `/admin/products/${id}`,
      submitLabel: "Perbarui Produk",
      product,
      csrfToken: req.session?.csrfToken,
      isEdit: true
    });
  }

  @Get(":id/variants")
  @Render("admin/products/variants")
  async variants(@Param("id") id: string, @Req() req: Request & { session?: AdminSession }) {
    const product = await this.productService.findOne(id);

    return {
      appName: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
      title: `${product.name} Variants`,
      intro: "Tambah, edit, dan hapus varian SKU untuk produk ini.",
      csrfToken: req.session?.csrfToken,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        categoryName: product.category?.name ?? "-",
        basePriceLabel: this.formatMoney(product.basePriceCents)
      },
      variantCount: product.variants?.length ?? 0,
      variants: (product.variants ?? []).map((variant) => this.toVariantViewModel(variant)),
      variantSizes: ["XS", "S", "M", "L", "XL", "XXL"]
    };
  }

  @Post()
  async create(@Body() body: CreateProductDto, @Res() res: Response) {
    await this.productService.create(body);
    return res.redirect("/admin/products");
  }

  @Post(":id")
  async update(@Param("id") id: string, @Body() body: UpdateProductDto, @Res() res: Response) {
    await this.productService.update(id, body);
    return res.redirect(`/admin/products/${id}/edit`);
  }

  @Post(":id/delete")
  async remove(@Param("id") id: string, @Res() res: Response) {
    await this.productService.remove(id);
    return res.redirect("/admin/products");
  }

  @Post(":productId/variants")
  async addVariant(@Param("productId") productId: string, @Body() body: CreateProductVariantDto, @Res() res: Response) {
    await this.productService.addVariant(productId, body);
    return res.redirect(`/admin/products/${productId}/variants`);
  }

  @Post("variants/:variantId")
  async updateVariant(@Param("variantId") variantId: string, @Body() body: UpdateProductVariantDto, @Res() res: Response) {
    const variant = await this.productService.updateVariant(variantId, body);
    return res.redirect(`/admin/products/${variant.productId}/variants`);
  }

  @Post("variants/:variantId/delete")
  async removeVariant(@Param("variantId") variantId: string, @Res() res: Response) {
    const variant = await this.productService.findVariantForView(variantId);
    await this.productService.removeVariant(variantId);
    return res.redirect(`/admin/products/${variant.productId}/variants`);
  }

  private async buildFormViewModel(params: {
    pageTitle: string;
    intro: string;
    action: string;
    submitLabel: string;
    product: Product;
    csrfToken?: string;
    isEdit: boolean;
  }) {
    const categories = await this.categoryService.findAll();
    const product = params.product;

    return {
      appName: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
      title: params.pageTitle,
      intro: params.intro,
      action: params.action,
      submitLabel: params.submitLabel,
      isEdit: params.isEdit,
      csrfToken: params.csrfToken,
      product: this.toProductFormView(product),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        displayOrder: category.displayOrder,
        isSelected: category.id === product.categoryId
      }))
    };
  }

  private emptyProduct(): Product {
    return {
      id: "",
      sku: "",
      name: "",
      slug: "",
      description: null,
      basePriceCents: 0,
      imageUrl: null,
      isActive: true,
      categoryId: "",
      category: undefined as never,
      variants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as Product;
  }

  private toProductFormView(product: Product): ProductFormView {
    return {
      id: product.id || undefined,
      sku: product.sku ?? "",
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      basePriceCents: product.basePriceCents ?? 0,
      categoryId: product.categoryId ?? "",
      imageUrl: product.imageUrl ?? "",
      isActive: typeof product.isActive === "boolean" ? product.isActive : true
    };
  }

  private toProductListItem(product: Product): ProductListItemView {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      categoryName: product.category?.name ?? "-",
      basePriceLabel: this.formatMoney(product.basePriceCents),
      isActive: product.isActive,
      statusLabel: product.isActive ? "Active" : "Inactive",
      variantsCount: product.variants?.length ?? 0
    };
  }

  private toVariantViewModel(variant: ProductVariant): VariantRowView {
    return {
      ...variant,
      variantPriceLabel: this.formatMoney(variant.variantPriceCents ?? 0)
    };
  }

  private formatMoney(amountCents: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amountCents);
  }

  private parsePositiveInt(value: string, fallback: number, min: number, max: number): number {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < min) return fallback;
    return Math.min(parsed, max);
  }
}
