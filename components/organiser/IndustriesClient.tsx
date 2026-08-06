"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2, Search } from "lucide-react";

type Industry = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
};

type Props = {
  industries: Industry[];
  siteId: number;
};

const EMPTY_FORM = { name: "", code: "", description: "" };

export function IndustriesClient({ industries: initial }: Props) {
  const [rows, setRows] = useState<Industry[]>(initial);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.code ?? "").toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowAdd(true);
    setError(null);
  }

  function openEdit(row: Industry) {
    setForm({ name: row.name, code: row.code ?? "", description: row.description ?? "" });
    setEditId(row.id);
    setShowAdd(true);
    setError(null);
  }

  function closeModal() {
    setShowAdd(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const url = editId ? `/api/organiser/industries/${editId}` : "/api/organiser/industries";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      if (editId) {
        setRows(r => r.map(x => x.id === editId ? data.industry : x));
      } else {
        setRows(r => [...r, data.industry].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this industry? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/organiser/industries/${id}`, { method: "DELETE" });
      setRows(r => r.filter(x => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code or description…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
          />
        </div>
        <p className="text-sm text-white/40 whitespace-nowrap">{filtered.length} of {rows.length}</p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-ink shadow-gold-sm transition hover:opacity-90 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> Add Industry
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3 w-12">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-white/30">
                  {search ? `No results for "${search}"` : `No industries yet — click "Add Industry" to create one.`}
                </td>
              </tr>
            )}
            {filtered.map(row => (
              <tr key={row.id} className="transition hover:bg-white/5">
                <td className="px-4 py-3 text-white/30">{row.id}</td>
                <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                <td className="px-4 py-3 text-white/60">{row.code ?? <span className="text-white/20">—</span>}</td>
                <td className="px-4 py-3 text-white/50 max-w-xs truncate">
                  {row.description ?? <span className="text-white/20">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(row)}
                      className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-gold"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-red-400 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === row.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">
                {editId ? "Edit Industry" : "Add Industry"}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Name <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Technology"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder="e.g. TECH"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Optional description"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editId ? "Save Changes" : "Add Industry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
