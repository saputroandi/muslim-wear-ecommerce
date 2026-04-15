import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { AppModule } from "./app.module";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  // normalize imports for runtime interop while keeping TS imports

  const factoryUnknown = connectPgSimple as unknown;
  let PgSessionCtor: unknown;
  if (typeof (factoryUnknown as { default?: unknown }).default === "function") {
    PgSessionCtor = (factoryUnknown as { default: (s: unknown) => unknown }).default(session);
  } else if (typeof factoryUnknown === "function") {
    PgSessionCtor = (factoryUnknown as (s: unknown) => unknown)(session);
  } else {
    throw new Error("connect-pg-simple import is not a function");
  }

  const dbHost = process.env.DB_HOST ?? "localhost";
  const dbPort = process.env.DB_PORT ?? "5432";
  const dbUser = process.env.DB_USER ?? "postgres";
  const dbPassword = process.env.DB_PASSWORD ?? "postgres";
  const dbName = process.env.DB_NAME ?? "muslim_wear";
  const sessionSecret = process.env.SESSION_SECRET ?? "change-me";

  const conString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  // Configure session store with explicit table name and auto-create
  const sessionStoreOptions: Record<string, unknown> = {
    conString,
    tableName: process.env.SESSION_TABLE_NAME ?? "user_sessions",
    createTableIfMissing: true
  };

  // create store instance from resolved constructor-like value
  type PgStoreCtor = new (opts?: Record<string, unknown>) => Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const PgStoreConstructor = PgSessionCtor as unknown as PgStoreCtor;

  app.use(
    session(
      {
        // runtime store constructor; typed as unknown then narrowed
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: runtime factory
        store: (new PgStoreConstructor(sessionStoreOptions) as unknown) as import("express-session").Store,
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 30, // 30 minutes
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production"
        }
      } as import("express-session").SessionOptions
    ) as unknown as import("express").RequestHandler
  );

  app.useStaticAssets(join(process.cwd(), "public"));
  app.setBaseViewsDir(join(process.cwd(), "views"));
  app.setViewEngine("hbs");

  const port = Number(process.env.APP_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
