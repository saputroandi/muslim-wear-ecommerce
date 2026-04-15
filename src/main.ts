import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { AppModule } from "./app.module";

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

  app.useStaticAssets(join(process.cwd(), "public"));
  app.setBaseViewsDir(join(process.cwd(), "views"));
  app.setViewEngine("hbs");

  const port = Number(process.env.APP_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
