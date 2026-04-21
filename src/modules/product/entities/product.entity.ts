import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Category } from "./category.entity";
import { ProductVariant } from "./product-variant.entity";

@Entity({ name: "products" })
@Unique(["slug"])
@Unique(["sku"])
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  sku!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 180 })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "base_price_cents", type: "integer" })
  basePriceCents!: number;

  @Column({ name: "image_url", type: "varchar", length: 255, nullable: true })
  imageUrl!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
