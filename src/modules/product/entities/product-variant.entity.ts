import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Product } from "./product.entity";

export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

@Entity({ name: "product_variants" })
@Unique(["sku"])
@Unique(["productId", "size", "color"])
export class ProductVariant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ type: "enum", enum: PRODUCT_SIZES })
  size!: ProductSize;

  @Column({ type: "varchar", length: 80 })
  color!: string;

  @Column({ type: "varchar", length: 100 })
  sku!: string;

  @Column({ type: "integer", default: 0 })
  stock!: number;

  @Column({ type: "integer", default: 0 })
  reserved!: number;

  @Column({ name: "variant_price_cents", type: "integer", nullable: true })
  variantPriceCents!: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
