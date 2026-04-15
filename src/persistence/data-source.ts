import "reflect-metadata";
import { DataSource } from "typeorm";
import configuration from "../../src/config/configuration";

const env = process.env;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST ?? "localhost",
  port: Number(env.DB_PORT ?? 5432),
  username: env.DB_USER ?? "postgres",
  password: env.DB_PASSWORD ?? "postgres",
  database: env.DB_NAME ?? "muslim_wear",
  entities: ["src/persistence/entities/*.ts", "dist/src/persistence/entities/*.js"],
  migrations: ["src/migrations/*.ts", "dist/src/migrations/*.js"],
  synchronize: false,
  logging: false
});

export default AppDataSource;
