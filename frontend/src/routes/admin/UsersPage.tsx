// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  role: "user" | "admin" | "superadmin";
  tokens_remaining: number;
  created_at?: string | null;
};

const API_BASE = import.meta.env.VITE_BACKEND_URL || "/api";
const api = (p: string) => `${API_BASE}${p}`.replace(/([^:]\/)\/+/g, "$1");

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const page = Math.floor(offset / limit) + 1;
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  async function fetchUsers(signal?: AbortSignal) {
    setLoading(true);
    setErr(null);
    try {
      const url = new URL(api("/admin/users"), window.location.origin);
      if (q) url.searchParams.set("q", q);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      const res = await fetch(url.toString().replace(window.location.origin, ""), { signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      if (e.name !== "AbortError") setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const c = new AbortController();
    fetchUsers(c.signal);
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, limit, offset]);

  const refresh = () => fetchUsers();

  async function changeRole(id: string, role: UserRow["role"]) {
    try {
      const res = await fetch(api(`/admin/users/${id}/role`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role: data.user.role } : r)));
    } catch (e: any) {
      alert(`Failed to update role: ${e.message || e}`);
    }
  }

  async function adjustTokens(id: string, delta: number) {
    try {
      const res = await fetch(api(`/admin/users/${id}/tokens`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, tokens_remaining: data.user.tokens_remaining } : r))
      );
    } catch (e: any) {
      alert(`Failed to update tokens: ${e.message || e}`);
    }
  }

  function setPage(nextPage: number) {
    const p = Math.max(1, Math.min(pages, nextPage));
    setOffset((p - 1) * limit);
  }

  return (
    <div className="px-6 lg:px-10 py-10 text-slate-100 text-lg lg:text-xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Users</h1>
          <p className="mt-2 text-slate-300 text-xl">
            Manage roles and token balances for all accounts.
          </p>
        </div>

        <div className="flex gap-4">
          <input
            value={q}
            onChange={(e) => {
              setOffset(0);
              setQ(e.target.value);
            }}
            placeholder="Search email…"
            className="w-64 md:w-80 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-sky-500"
          />
          <select
            className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-sky-500"
            value={limit}
            onChange={(e) => {
              setOffset(0);
              setLimit(Number(e.target.value));
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            className="rounded-2xl bg-sky-600 hover:bg-sky-500 px-6 py-4 text-lg font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-6 rounded-xl border border-red-600 bg-red-900/30 px-5 py-4 text-red-200 text-lg">
          {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-lg">
        <table className="min-w-full text-lg lg:text-xl">
          <thead className="bg-slate-800/70">
            <tr className="text-left">
              <th className="px-6 py-5 font-bold text-slate-300">Email</th>
              <th className="px-6 py-5 font-bold text-slate-300">Role</th>
              <th className="px-6 py-5 font-bold text-slate-300">Tokens</th>
              <th className="px-6 py-5 font-bold text-slate-300">Adjust</th>
              <th className="px-6 py-5 font-bold text-slate-300">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-6 py-8 text-slate-300" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-slate-300" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((u) => (
                <tr key={u.id} className="border-t border-slate-800/80">
                  <td className="px-6 py-5">{u.email || "—"}</td>
                  <td className="px-6 py-5">
                    <select
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-sky-500"
                      value={u.role || "user"}
                      onChange={(e) => changeRole(u.id, e.target.value as any)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 font-semibold">{u.tokens_remaining ?? 0}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-3">
                      {[-100, -10, +10, +100].map((d) => (
                        <button
                          key={d}
                          onClick={() => adjustTokens(u.id, d)}
                          className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-base hover:bg-slate-700/60"
                          title={d > 0 ? `Add ${d}` : `Remove ${Math.abs(d)}`}
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-300">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between text-lg">
        <div className="text-slate-300">
          Showing <span className="font-semibold">{rows.length}</span> of{" "}
          <span className="font-semibold">{total}</span> • Page{" "}
          <span className="font-semibold">{page}</span> /{" "}
          <span className="font-semibold">{pages}</span>
        </div>
        <div className="flex gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-3 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}