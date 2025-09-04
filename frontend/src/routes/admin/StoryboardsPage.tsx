// @ts-nocheck
import { useEffect, useState } from "react";
import supabase from "@/supabaseClient";
import Button from "@/components/ui/Button";

type Row = { id: string; module_name: string | null; owner_id: string | null; created_at: string };

export default function StoryboardsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("storyboards")
        .select("id,module_name,owner_id,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) setErr(error.message);
      else setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-0 tracking-tight font-outfit text-[#BC57CF]">
          Storyboards
        </h1>
        {/* Example actions */}
        <div className="flex gap-2">
          <Button>New Storyboard</Button>
          <Button variant="ghost">Refresh</Button>
        </div>
      </div>

      {loading && <div className="text-lg">Loading…</div>}
      {err && <div className="text-red-400 text-base">{err}</div>}

      {!loading && !err && (
        <div className="overflow-auto rounded-xl border border-slate-700 shadow-lg">
          <table className="min-w-[800px] w-full text-base font-inter">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Module</th>
                <th className="text-left px-6 py-4 font-semibold">Owner</th>
                <th className="text-left px-6 py-4 font-semibold">Created</th>
                <th className="text-right px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-800 hover:bg-[#0387E6]/20 transition"
                >
                  <td className="px-6 py-4">{r.module_name || "—"}</td>
                  <td className="px-6 py-4">{r.owner_id?.slice(0, 8) || "—"}</td>
                  <td className="px-6 py-4">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" size="sm">Open</Button>
                      <Button variant="ghost" size="sm">Duplicate</Button>
                      <Button variant="danger" size="sm">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-slate-400 text-center" colSpan={4}>
                    No storyboards yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}