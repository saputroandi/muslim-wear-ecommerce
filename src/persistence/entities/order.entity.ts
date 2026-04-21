import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { OrderItem } from "./order-item.entity";

@Entity({ name: "orders" })
@Unique(["orderNumber"])
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "order_number", type: "varchar", length: 50 })
  orderNumber!: string;

  @Column({ type: "varchar", length: 50, default: "pending_payment" })
  status!: string;

  @Column({ name: "total_amount_cents", type: "integer" })
  totalAmountCents!: number;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
