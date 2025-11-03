// backend/src/routes/admin.ts
import express, { type Response, type Request } from 'express';
import pool from '../db';

const router = express.Router();

/* -------------------- helpers -------------------- */
function toInt(value: string | undefined, def: number, min = -1_000_000, max = 1_000_000) {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.max(min, Math.min(max, Math.floor(n)));
  return def;
}
function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

/**
 * EXPECTED TABLE SHAPE (Postgres/Supabase):
 *
 *   create table if not exists profiles (
 *     id uuid primary key references auth.users(id) on delete cascade,
 *     email text,
 *     role text default 'user',
 *     tokens_remaining int default 0,
 *     created_at timestamptz default now()
 *   );
 *
 * Make sure these columns exist or adjust the queries below to your schema.
 */

/* ==================================================
 * GET /api/admin/users
 *   q?: string       (search in p.email ilike %q%)
 *   limit?: number   (default 50, max 200)
 *   offset?: number  (default 0)
 * ================================================== */
router.get("/users", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    const limit = toInt(req.query.limit as string | undefined, 50, 1, 200);
    const offset = toInt(req.query.offset as string | undefined, 0, 0, 10_000);

    const params: any[] = [];
    let where = "";
    if (q) {
      params.push(`%${q}%`);
      where = `where p.email ilike $${params.length}`;
    }

    const sql = `
      select
        p.id,
        p.email,
        p.role,
        p.tokens_remaining,
        p.created_at
      from profiles p
      ${where}
      order by p.created_at desc nulls last
      limit $${params.push(limit)}
      offset $${params.push(offset)}
    `;
    const { rows } = await pool.query(sql, params);

    // separate count query (don’t reuse params array index)
    const countParams: any[] = [];
    let countWhere = "";
    if (q) {
      countParams.push(`%${q}%`);
      countWhere = `where p.email ilike $1`;
    }
    const { rows: countRows } = await pool.query(
      `select count(*)::int as total from profiles p ${countWhere}`,
      countParams
    );
    const total = countRows?.[0]?.total ?? 0;

    res.json({ data: rows, total, limit, offset, q });
  } catch (err) {
    console.error("Error fetching users:", err);
    return jsonError(res, 500, "Failed to fetch users");
  }
});

/* ==================================================
 * GET /api/admin/users/:id
 * ================================================== */
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      select
        p.id,
        p.email,
        p.role,
        p.tokens_remaining,
        p.created_at
      from profiles p
      where p.id = $1
      `,
      [id]
    );

    if (!rows.length) return jsonError(res, 404, "User not found");
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching user by id:", err);
    return jsonError(res, 500, "Failed to fetch user");
  }
});

/* ==================================================
 * POST /api/admin/users/:id/tokens
 * Body: { delta: number }  // can be negative; result is clamped to >= 0
 * ================================================== */
router.post("/users/:id/tokens", async (req, res) => {
  try {
    const { id } = req.params;
    const rawDelta = req.body?.delta;
    if (rawDelta === undefined || rawDelta === null)
      return jsonError(res, 400, "Missing 'delta' in request body");

    const delta = toInt(String(rawDelta), 0, -1_000_000, 1_000_000);
    if (delta === 0) return jsonError(res, 400, "Delta cannot be 0");

    // Clamp to >= 0 with GREATEST
    const { rows } = await pool.query(
      `
      update profiles
      set tokens_remaining = GREATEST(0, COALESCE(tokens_remaining, 0) + $2)
      where id = $1
      returning id, email, role, tokens_remaining, created_at
      `,
      [id, delta]
    );

    if (!rows.length) return jsonError(res, 404, "User not found");
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("Error updating tokens:", err);
    return jsonError(res, 500, "Failed to update tokens");
  }
});

/* ==================================================
 * POST /api/admin/users/:id/role
 * Body: { role: "user" | "admin" | "superadmin" }
 * ================================================== */
router.post("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const role = (req.body?.role as string)?.toLowerCase?.();

    const allowed = new Set(["user", "admin", "superadmin"]);
    if (!role || !allowed.has(role)) {
      return jsonError(res, 400, "Invalid role. Use 'user', 'admin', or 'superadmin'.");
    }

    const { rows } = await pool.query(
      `
      update profiles
      set role = $2
      where id = $1
      returning id, email, role, tokens_remaining, created_at
      `,
      [id, role]
    );

    if (!rows.length) return jsonError(res, 404, "User not found");
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("Error updating role:", err);
    return jsonError(res, 500, "Failed to update role");
  }
});

/* ==================================================
 * GET /api/admin/overview
 * Quick stats for admin dashboard tiles
 * ================================================== */
router.get("/overview", async (_req, res) => {
  try {
    const [{ rows: userRows }, { rows: tokenRows }] = await Promise.all([
      pool.query(`select count(*)::int as users from profiles`),
      pool.query(`select coalesce(sum(tokens_remaining), 0)::bigint as total_tokens from profiles`),
    ]);

    const users = userRows?.[0]?.users ?? 0;
    const totalTokens = Number(tokenRows?.[0]?.total_tokens ?? 0);
    const avgTokens = users > 0 ? Math.round(totalTokens / users) : 0;

    res.json({ users, totalTokens, avgTokens });
  } catch (err) {
    console.error("Error fetching overview:", err);
    return jsonError(res, 500, "Failed to fetch overview");
  }
});

module.exports = router;
