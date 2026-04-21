import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, type TypeOrmModuleOptions } from "@nestjs/typeorm";
import configuration from "./config/configuration";
import { envValidationSchema } from "./config/env.validation";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { HealthModule } from "./modules/health/health.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { ProductModule } from "./modules/product/product.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { StorefrontModule } from "./modules/storefront/storefront.module";
import { AdminUser } from "./persistence/entities/admin-user.entity";
import { Order } from "./persistence/entities/order.entity";
import { Product } from "./persistence/entities/product.entity";
import { Category } from "./persistence/entities/category.entity";
import { ProductVariant } from "./persistence/entities/product-variant.entity";
import { AuditLog } from "./persistence/entities/audit-log.entity";
import { PasswordResetToken } from "./persistence/entities/password-reset-token.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: "postgres",
        host: configService.get<string>("database.host", "localhost"),
        port: configService.get<number>("database.port", 5432),
        database: configService.get<string>("database.name", "muslim_wear"),
        username: configService.get<string>("database.user", "postgres"),
        password: configService.get<string>("database.password", "postgres"),
        entities: [AdminUser, Category, Product, ProductVariant, Order, AuditLog, PasswordResetToken],
        synchronize: configService.get<boolean>("database.synchronize", false),
        logging: configService.get<string>("app.nodeEnv", "development") === "development"
      })
    }),
    HealthModule,
    StorefrontModule,
    ProductModule,
    AdminModule,
    AuthModule,
    CatalogModule,
    CheckoutModule,
    PaymentsModule,
    OrdersModule,
    MarketingModule
  ]
})
export class AppModule {}
