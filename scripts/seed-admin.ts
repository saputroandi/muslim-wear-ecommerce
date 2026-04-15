import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";
import { AdminUser } from "../src/persistence/entities/admin-user.entity";

// Use universal import style to work under ts-node/commonjs
dotenv.config();

const ds = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "muslim_wear",
  entities: [AdminUser],
  synchronize: false
});

async function main(): Promise<void> {
  await ds.initialize();
  const repo = ds.getRepository(AdminUser);
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in env before running seed.");
    process.exit(1);
  }

  const existing = await repo.findOneBy({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    await ds.destroy();
    process.exit(0);
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const admin = repo.create({ email, passwordHash, isActive: true });
  await repo.save(admin);
  console.log("Admin created:", email);
  await ds.destroy();
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
