import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { AppModule } from "./app.module";
const expressSessionModule = require("express-session");
// connect-pg-simple may export differently depending on CJS/ESM interop in build
// use require() at runtime to avoid "is not a function" errors in compiled output
const connectPgSimpleModule = require("connect-pg-simple");

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

  const sessionMiddleware = expressSessionModule.default ?? expressSessionModule;
  const connectPgSimpleFactory = connectPgSimpleModule.default ?? connectPgSimpleModule;
  const PgSession = connectPgSimpleFactory(sessionMiddleware);

  const dbHost = process.env.DB_HOST ?? "localhost";
  const dbPort = process.env.DB_PORT ?? "5432";
  const dbUser = process.env.DB_USER ?? "postgres";
  const dbPassword = process.env.DB_PASSWORD ?? "postgres";
  const dbName = process.env.DB_NAME ?? "muslim_wear";
  const sessionSecret = process.env.SESSION_SECRET ?? "change-me";

  const conString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  // Configure session store with explicit table name and auto-create
  const sessionStoreOptions = {
    conString,
    tableName: process.env.SESSION_TABLE_NAME ?? "user_sessions",
    createTableIfMissing: true
  } as any;

  app.use(
    sessionMiddleware({
      store: new PgSession(sessionStoreOptions),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 30, // 30 minutes
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      }
    }) as any
  );

  app.useStaticAssets(join(process.cwd(), "public"));
  app.setBaseViewsDir(join(process.cwd(), "views"));
  app.setViewEngine("hbs");

  const port = Number(process.env.APP_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
