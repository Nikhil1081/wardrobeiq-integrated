import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  MONGODB_URI: z.string().default('mongodb://localhost:27017'),
  MONGODB_DB_NAME: z.string().default('wardrobe_agent'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('wardrobeiq-secret-jwt-key-2026-production'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
