// backend/src/db.ts
import { Pool } from "pg";

const CONN =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_POSTGRES_URL;

if (!CONN) {
  // Prefer a single connection string. Example:
  // DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.HOST:5432/postgres
  throw new Error(
    "DATABASE_URL (or SUPABASE_DB_URL/SUPABASE_POSTGRES_URL) is not set. Add it to your backend .env."
  );
}

const pool = new Pool({
  connectionString: CONN,
  // Optional but helpful locally
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : (false as any),
});

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

export default pool;
