import { drizzle } from "drizzle-orm/vercel-postgres";
import * as tables from "./tables";

function createDb() {
  // Render / standalone: use node-postgres Pool via DATABASE_URL
  if (process.env.DATABASE_URL) {
    // Dynamic import avoids bundling pg when deployed on Vercel
    const { Pool } = require("pg") as typeof import("pg");
    const { drizzle: drizzlePg } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });

    return drizzlePg(pool, { schema: tables });
  }

  // Vercel serverless: use @vercel/postgres (neon under the hood)
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  return drizzle(sql, { schema: tables });
}

export const db = createDb();
