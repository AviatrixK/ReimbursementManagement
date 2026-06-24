import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.js";

// Create the PostgreSQL connection pool
// max: 1 is recommended for Supabase's transaction pooler (port 6543)
const client = postgres(env.databaseUrl, { max: 1 });

// Initialize the Drizzle ORM instance
export const db = drizzle(client);

// Test the database connection
export const testDbConnection = async () => {
  try {
    await client`SELECT 1`;
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};
