import { z } from "zod/v4";

const envSchema = z.object({
  DUCKDB_WORKER_URL: z.string(),
});

export const env = envSchema.parse(process.env);
