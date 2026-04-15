import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  APP_NAME: Joi.string().default("Muslim Wear Ecommerce"),
  APP_PORT: Joi.number().port().default(3000),
  APP_URL: Joi.string().uri({ scheme: ["http", "https"] }).default("http://localhost:3000"),
  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().default("muslim_wear"),
  DB_USER: Joi.string().default("postgres"),
  DB_PASSWORD: Joi.string().default("postgres"),
  DB_SYNCHRONIZE: Joi.boolean().truthy("true").falsy("false").default(false)
});
