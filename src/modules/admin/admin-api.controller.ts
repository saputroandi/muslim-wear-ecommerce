import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Repository } from "typeorm";
import { Product } from "../../persistence/entities/product.entity";
import { Order } from "../../persistence/entities/order.entity";
import { AdminSessionGuard } from "../auth/admin-session.guard";
import { AuditLogService } from "../audit/audit-log.service";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

interface AdminSession {
  adminUserId?: string;
}

@Controller("api/admin")
@UseGuards(AdminSessionGuard)
export class AdminApiController {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly audit: AuditLogService
  ) {}

  @Get("csrf")
  csrf(@Req() req: Request & { session?: { csrfToken?: string } }) {
    return { csrfToken: req.session?.csrfToken };
  }

  @Patch("products/:id")
  async updateProduct(@Param("id") id: string, @Body() body: UpdateProductDto, @Req() req: Request & { session?: AdminSession }) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");

    const changes: Record<string, unknown> = {};
    if (typeof body.name !== "undefined" && body.name !== product.name) {
      changes.name = { from: product.name, to: body.name };
      product.name = body.name;
    }
    if (typeof body.basePriceCents !== "undefined" && body.basePriceCents !== product.basePriceCents) {
      changes.basePriceCents = { from: product.basePriceCents, to: body.basePriceCents };
      product.basePriceCents = body.basePriceCents;
    }
    if (typeof body.isActive !== "undefined" && body.isActive !== product.isActive) {
      changes.isActive = { from: product.isActive, to: body.isActive };
      product.isActive = body.isActive;
    }

    await this.productRepo.save(product);

    await this.audit.record(req.session?.adminUserId ?? null, "product_updated", {
      ip: req.ip,
      productId: product.id,
      changes
    });

    return { ok: true, productId: product.id };
  }

  @Patch("orders/:id/status")
  async updateOrderStatus(
    @Param("id") id: string,
    @Body() body: UpdateOrderStatusDto,
    @Req() req: Request & { session?: AdminSession }
  ) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");

    const from = order.status;
    order.status = body.status;
    await this.orderRepo.save(order);

    await this.audit.record(req.session?.adminUserId ?? null, "order_status_updated", {
      ip: req.ip,
      orderId: order.id,
      from,
      to: order.status
    });

    return { ok: true, orderId: order.id };
  }
}
