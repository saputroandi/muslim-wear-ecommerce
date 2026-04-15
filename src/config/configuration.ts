const isTrue = (value: string | undefined): boolean => value === "true";

export default () => ({
  app: {
    name: process.env.APP_NAME ?? "Muslim Wear Ecommerce",
    port: Number(process.env.APP_PORT ?? 3000),
    url: process.env.APP_URL ?? "http://localhost:3000",
    nodeEnv: process.env.NODE_ENV ?? "development"
  },
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    name: process.env.DB_NAME ?? "muslim_wear",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    synchronize: isTrue(process.env.DB_SYNCHRONIZE)
  }
});

