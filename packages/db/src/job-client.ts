import { drizzle } from "drizzle-orm/d1";
import type { Database } from "./client";
import * as schema from "./schema";

/**
 * Creates a new job-optimized database instance for D1.
 *
 * Note: D1 connection management is handled by Cloudflare Workers runtime.
 * This function creates a drizzle instance with the provided D1 binding.
 */
export const createJobDb = (d1Binding: D1Database) => {
  const db = drizzle(d1Binding, {
    schema,
    casing: "snake_case",
  });

  return {
    db: db as Database,
    disconnect: () => {
      // D1 connections are managed by Cloudflare Workers runtime
      // No manual cleanup needed
      return Promise.resolve();
    },
  };
};
