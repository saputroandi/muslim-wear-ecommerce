import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Order } from "./order.entity";
import { ProductVariant } from "../../modules/product/entities/product-variant.entity";

@Entity({ name: "order_items" })
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "order_id", type: "uuid" })
  orderId!: string;

  @ManyToOne(() => ProductVariant, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "variant_id" })
  variant!: ProductVariant;

  @Column({ name: "variant_id", type: "uuid" })
  variantId!: string;

  @Column({ name: "product_id", type: "uuid" })
  productId!: string;

  @Column({ name: "product_name", type: "varchar", length: 160 })
  productName!: string;

  @Column({ name: "variant_sku", type: "varchar", length: 100 })
  variantSku!: string;

  @Column({ type: "varchar", length: 20 })
  size!: string;

  @Column({ type: "varchar", length: 80 })
  color!: string;

  @Column({ type: "integer" })
  quantity!: number;

  @Column({ name: "unit_price_cents", type: "integer" })
  unitPriceCents!: number;

  @Column({ name: "line_total_cents", type: "integer" })
  lineTotalCents!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
