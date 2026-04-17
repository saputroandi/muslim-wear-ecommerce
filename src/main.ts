import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { AppModule } from "./app.module";
import * as session from "express-session";
import * as cookieParser from "cookie-parser";
import { createRateLimiter } from "./middleware/rate-limiter";
import { csrfMiddleware } from "./middleware/csrf.middleware";

type ConnectPgSimpleFactory = (session: typeof import("express-session")) => new (
  opts?: Record<string, unknown>
) => import("express-session").Store;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  const dbHost = process.env.DB_HOST ?? "localhost";
  const dbPort = process.env.DB_PORT ?? "5432";
  const dbUser = process.env.DB_USER ?? "postgres";
  const dbPassword = process.env.DB_PASSWORD ?? "postgres";
  const dbName = process.env.DB_NAME ?? "muslim_wear";
  const sessionSecret = process.env.SESSION_SECRET ?? "change-me";

  const conString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  // Resolve connect-pg-simple factory (handles CJS/ESM interop)
  const rawPgSimple = await import("connect-pg-simple");
  const pgSimpleFactory = (
    typeof rawPgSimple === "function"
      ? rawPgSimple
      : (rawPgSimple as unknown as { default: unknown }).default
  ) as ConnectPgSimpleFactory;

  const PgStore = pgSimpleFactory(session);

  const store = new PgStore({
    conString,
    tableName: process.env.SESSION_TABLE_NAME ?? "user_sessions",
    createTableIfMissing: true,
  });

  app.use(cookieParser());
  app.use(
    session({
      store,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 30,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use("/auth", csrfMiddleware);
  app.use("/api/admin", csrfMiddleware);

  app.use("/auth/login", createRateLimiter({ windowMs: 15 * 60_000, max: 6 }));
  app.use("/auth/forgot-password", createRateLimiter({ windowMs: 15 * 60_000, max: 3 }));

  app.useStaticAssets(join(process.cwd(), "public"));
  app.setBaseViewsDir(join(process.cwd(), "views"));
  app.setViewEngine("hbs");

  const port = Number(process.env.APP_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();