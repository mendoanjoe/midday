import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// D1 database instance
// In Cloudflare Workers, the D1 binding is injected by the runtime
// For local development, we'll need to use wrangler or a mock
export const db = (d1Binding: D1Database) => {
  return drizzle(d1Binding, {
    schema,
    casing: "snake_case",
  });
};

// For compatibility with existing code that expects a Database type
export type Database = ReturnType<typeof db>;

// Helper function to get database instance
// In Workers, you'd call this with env.DB where DB is your D1 binding
export const connectDb = async (d1Binding: D1Database) => {
  return db(d1Binding);
};

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};

// Connection pool stats are not applicable for D1 as it's managed by Cloudflare
export const getConnectionPoolStats = () => {
  return {
    timestamp: new Date().toISOString(),
    region: process.env.FLY_REGION || "unknown",
    instance: process.env.FLY_ALLOC_ID || "local",
    pools: {},
    summary: {
      totalConnections: 0,
      totalActive: 0,
      totalWaiting: 0,
      hasExhaustedPools: false,
      utilizationPercent: 0,
    },
    message: "D1 connection pooling is managed by Cloudflare Workers runtime",
  };
};
