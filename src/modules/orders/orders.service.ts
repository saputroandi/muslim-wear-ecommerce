import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ProductService } from "../product/services/product.service";
import { Order } from "../../persistence/entities/order.entity";
import { OrderItem } from "../../persistence/entities/order-item.entity";
import { CreateOrderDto } from "./dto/create-order.dto";

type OrderLifecycleStatus = "pending_payment" | "confirmed" | "cancelled";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
    private readonly productService: ProductService
  ) {}

  starterStatus(): { module: string; status: string; note: string } {
    return {
      module: "orders",
      status: "inventory-integrated",
      note: "Order lifecycle now reserves, releases, and confirms stock through the product service."
    };
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderRepository = queryRunner.manager.getRepository(Order);
      const orderItemRepository = queryRunner.manager.getRepository(OrderItem);

      const order = orderRepository.create({
        orderNumber: this.generateOrderNumber(),
        status: "pending_payment",
        totalAmountCents: 0
      });

      const savedOrder = await orderRepository.save(order);
      const items: OrderItem[] = [];
      let totalAmountCents = 0;

      for (const item of dto.items) {
        const variant = await this.productService.findVariantForView(item.variantId);
        await this.productService.reserveStock(item.variantId, item.quantity, queryRunner);

        const unitPriceCents = variant.variantPriceCents ?? variant.product.basePriceCents;
        const lineTotalCents = unitPriceCents * item.quantity;
        totalAmountCents += lineTotalCents;

        items.push(
          orderItemRepository.create({
            orderId: savedOrder.id,
            variantId: variant.id,
            productId: variant.productId,
            productName: variant.product.name,
            variantSku: variant.sku,
            size: variant.size,
            color: variant.color,
            quantity: item.quantity,
            unitPriceCents,
            lineTotalCents
          })
        );
      }

      savedOrder.totalAmountCents = totalAmountCents;
      await orderRepository.save(savedOrder);
      await orderItemRepository.save(items);

      await queryRunner.commitTransaction();
      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return this.runOrderLifecycle(orderId, "cancelled", async (order, queryRunner) => {
      if (order.status === "cancelled") {
        throw new BadRequestException(`Order ${orderId} is already cancelled`);
      }
      if (order.status === "confirmed") {
        throw new BadRequestException(`Order ${orderId} is already confirmed`);
      }

      for (const item of order.items) {
        await this.productService.releaseStock(item.variantId, item.quantity, queryRunner);
      }
    });
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return this.runOrderLifecycle(orderId, "confirmed", async (order, queryRunner) => {
      if (order.status === "confirmed") {
        throw new BadRequestException(`Order ${orderId} is already confirmed`);
      }
      if (order.status === "cancelled") {
        throw new BadRequestException(`Order ${orderId} is cancelled and cannot be confirmed`);
      }

      for (const item of order.items) {
        await this.productService.confirmReservedStock(item.variantId, item.quantity, queryRunner);
      }
    });
  }

  async findOne(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: true
      }
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    return order;
  }

  private async runOrderLifecycle(
    orderId: string,
    nextStatus: OrderLifecycleStatus,
    mutation: (order: Order, queryRunner: ReturnType<DataSource["createQueryRunner"]>) => Promise<void>
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderRepository = queryRunner.manager.getRepository(Order);
      const order = await orderRepository.findOne({
        where: { id: orderId },
        relations: {
          items: true
        }
      });

      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      await mutation(order, queryRunner);
      order.status = nextStatus;
      await orderRepository.save(order);

      await queryRunner.commitTransaction();
      return this.findOne(orderId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${timestamp}-${suffix}`;
  }
}
