import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Repository } from "typeorm";
import { Order } from "../../persistence/entities/order.entity";
import { AdminSessionGuard } from "../auth/admin-session.guard";
import { AuditLogService } from "../audit/audit-log.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

interface AdminSession {
  adminUserId?: string;
}

@Controller("api/admin")
@UseGuards(AdminSessionGuard)
export class AdminApiController {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly audit: AuditLogService
  ) {}

  @Get("csrf")
  csrf(@Req() req: Request & { session?: { csrfToken?: string } }) {
    return { csrfToken: req.session?.csrfToken };
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
