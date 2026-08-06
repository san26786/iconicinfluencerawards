"use client";

// CSV import wizard: Upload → Map columns → Check duplicates → Import.
// Everything heavy happens in the browser (parse + map + de-dupe), then the
// survivors are uploaded in ~1k-row chunks so it scales to ~10k rows without
// hitting serverless body-size / timeout limits.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

const SEP = String.fromCharCode(31); // unit separator for dup keys
const CHUNK = 250;

type Target =
  | "email"
  | "firstName"
  | "lastName"
  | "company"
  | "phone"
  | "title"
  | "position"
  | "gender"
  | "custom"
  | "ignore";
type Mode = "check" | "skip" | "allow"; // skip-dupes (default) | skip-check | allow-dupes

const KNOWN_TARGETS: { value: Target; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "title", label: "Title" },
  { value: "position", label: "Position" },
  { value: "gender", label: "Gender" },
  { value: "company", label: "Company" },
  { value: "phone", label: "Phone" },
  { value: "custom", label: "Custom field" },
  { value: "ignore", label: "Ignore" },
];

// Mirror of lib/fields.slugifyKey — keys generated here are what gets stored.
function slugify(header: string): string {
  const words = header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  let key =
    words[0] +
    words
      .slice(1)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("");
  if (/^[0-9]/.test(key)) key = `f${key[0].toUpperCase()}${key.slice(1)}`;
  return key.slice(0, 80);
}

function autoDetect(header: string): Target {
  const h = header.trim();
  // Only treat as the email column when "email" is the trailing token, so
  // metadata fields like "Work Email Status" / "Email Quality" stay custom.
  if (/\be-?mail(\s*address)?\s*$/i.test(h)) return "email";
  if (/^(first|fname|given)\b/i.test(h) && !/\bemail\b/i.test(h))
    return "firstName";
  if (/^(last|lname|surname|family)\b/i.test(h) && !/\bemail\b/i.test(h))
    return "lastName";
  if (/^(position|role)$/i.test(h)) return "position";
  if (/^(title|job title)\b/i.test(h)) return "title";
  if (/^(gender|sex)$/i.test(h)) return "gender";
  if (/^(company|organi[sz]ation|org|business)\b/i.test(h) && !/\bemail\b/i.test(h))
    return "company";
  if (/\b(phone|mobile|tel|cell)\b/i.test(h) && !/\bemail\b/i.test(h))
    return "phone";
  return "custom";
}

function parseCsv(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const grid: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) grid.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((x) => x.trim() !== "")) grid.push(row);
  }
  if (grid.length < 2) return { headers: [], rows: [] };
  const headers = grid[0].map((h) => h.trim());
  const rows = grid.slice(1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, idx) => {
      o[h] = (r[idx] ?? "").trim();
    });
    return o;
  });
  return { headers, rows };
}

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

type Structured = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  position: string;
  gender: string;
  phone: string;
  custom: Record<string, string>;
};

const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none [&_option]:bg-ink";

export function ImportWizard({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<
    "upload" | "map" | "dedup" | "importing" | "done"
  >("upload");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState("csv");

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, Target>>({});

  const [matchCols, setMatchCols] = useState<string[]>(["email"]);
  const [mode, setMode] = useState<Mode>("check");
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<{
    valid: number;
    inFile: number;
    existing: number;
    toImport: number;
  } | null>(null);

  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);

  /* ── Upload ──────────────────────────────────────────────────────────── */
  const onFile = async (file: File) => {
    setError("");
    try {
      const { headers: h, rows: r } = parseCsv(await file.text());
      if (h.length === 0 || r.length === 0) {
        setError("No data rows found in that CSV.");
        return;
      }
      const auto: Record<string, Target> = {};
      h.forEach((header) => {
        auto[header] = autoDetect(header);
      });
      setFileName(file.name);
      setHeaders(h);
      setRows(r);
      setMapping(auto);
      setScan(null);
      setStep("map");
    } catch {
      setError("Could not read that file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ── Mapping → structured rows ───────────────────────────────────────── */
  const emailHeader = useMemo(
    () => headers.find((h) => mapping[h] === "email") ?? null,
    [headers, mapping],
  );

  // Custom fields (slug + label) from headers mapped to "custom".
  const customDefs = useMemo(() => {
    const defs: { header: string; key: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const h of headers) {
      if (mapping[h] === "custom") {
        const key = slugify(h);
        if (key && !seen.has(key)) {
          seen.add(key);
          defs.push({ header: h, key, label: h });
        }
      }
    }
    return defs;
  }, [headers, mapping]);

  const buildStructured = (): Structured[] => {
    const targetHeader = (t: Target) => headers.find((h) => mapping[h] === t);
    const fnH = targetHeader("firstName");
    const lnH = targetHeader("lastName");
    const tiH = targetHeader("title");
    const poH = targetHeader("position");
    const geH = targetHeader("gender");
    const coH = targetHeader("company");
    const phH = targetHeader("phone");
    const out: Structured[] = [];
    for (const r of rows) {
      const email = (emailHeader ? r[emailHeader] : "").trim().toLowerCase();
      if (!emailOk(email)) continue;
      const custom: Record<string, string> = {};
      for (const d of customDefs) {
        const v = (r[d.header] ?? "").trim();
        if (v) custom[d.key] = v;
      }
      out.push({
        email,
        firstName: (fnH ? r[fnH] : "").trim(),
        lastName: (lnH ? r[lnH] : "").trim(),
        title: (tiH ? r[tiH] : "").trim(),
        position: (poH ? r[poH] : "").trim(),
        gender: (geH ? r[geH] : "").trim(),
        company: (coH ? r[coH] : "").trim(),
        phone: (phH ? r[phH] : "").trim(),
        custom,
      });
    }
    return out;
  };

  const matchOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    const has = (t: Target) => headers.some((h) => mapping[h] === t);
    if (has("email")) opts.push({ id: "email", label: "Email" });
    if (has("firstName")) opts.push({ id: "firstName", label: "First name" });
    if (has("lastName")) opts.push({ id: "lastName", label: "Last name" });
    if (has("company")) opts.push({ id: "company", label: "Company" });
    if (has("phone")) opts.push({ id: "phone", label: "Phone" });
    if (has("title")) opts.push({ id: "title", label: "Title" });
    if (has("position")) opts.push({ id: "position", label: "Position" });
    if (has("gender")) opts.push({ id: "gender", label: "Gender" });
    customDefs.forEach((d) => opts.push({ id: d.key, label: d.label }));
    return opts;
  }, [headers, mapping, customDefs]);

  const dupKey = (s: Structured, cols: string[]) =>
    cols
      .map((c) => {
        const v =
          c === "email"
            ? s.email
            : c === "firstName"
              ? s.firstName
              : c === "lastName"
                ? s.lastName
                : c === "title"
                  ? s.title
                  : c === "position"
                    ? s.position
                    : c === "gender"
                      ? s.gender
                      : c === "company"
                        ? s.company
                        : c === "phone"
                          ? s.phone
                          : (s.custom[c] ?? "");
        return v.trim().toLowerCase();
      })
      .join(SEP);

  /* ── Dedup scan ──────────────────────────────────────────────────────── */
  const goToDedup = () => {
    if (!emailHeader) {
      setError("Map one column to Email — it is required.");
      return;
    }
    setError("");
    setScan(null);
    setStep("dedup");
  };

  // Only ever runs in "check" mode (the duplicate-skipping mode). De-dupes the
  // file against itself and against existing contacts on the chosen columns.
  const runScan = async (): Promise<Structured[]> => {
    const all = buildStructured();
    if (matchCols.length === 0) {
      setError(
        "Pick at least one column to match on, or choose a different mode.",
      );
      return [];
    }

    setScanning(true);
    setError("");
    try {
      // Build candidate keys here so we send only what we need to check.
      const candidateKeys = all.map((s) => dupKey(s, matchCols));
      let existingSet = new Set<string>();
      const res = await fetch("/api/organiser/potential-users/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cols: matchCols, keys: candidateKeys }),
      });
      const data = await res.json().catch(() => ({ existing: [] }));
      existingSet = new Set<string>(Array.isArray(data.existing) ? data.existing : []);

      const seen = new Set<string>();
      let inFile = 0;
      let existing = 0;
      const survivors: Structured[] = [];
      for (const s of all) {
        const k = dupKey(s, matchCols);
        if (seen.has(k)) {
          inFile++;
          continue;
        }
        seen.add(k);
        if (existingSet.has(k)) {
          existing++;
          continue;
        }
        survivors.push(s);
      }
      setScan({
        valid: all.length,
        inFile,
        existing,
        toImport: survivors.length,
      });
      return survivors;
    } finally {
      setScanning(false);
    }
  };

  /* ── Import (chunked) ────────────────────────────────────────────────── */
  const doImport = async () => {
    let toUpload: Structured[];
    if (mode === "check") {
      // Skip-duplicates: import only the de-duped survivors.
      if (matchCols.length === 0) {
        setError(
          "Pick at least one column to match on, or choose a different mode.",
        );
        return;
      }
      toUpload = await runScan();
    } else {
      // "allow" / "skip" — import every valid row, no de-duping.
      toUpload = buildStructured();
    }
    if (toUpload.length === 0) {
      setError(
        mode === "check"
          ? "Nothing to import — every valid row is a duplicate."
          : "Nothing to import — no rows had a valid email address.",
      );
      return;
    }

    const fieldDefs = customDefs.map((d) => ({ key: d.key, label: d.label }));
    setStep("importing");
    setProgress(0);
    let inserted = 0;
    let skipped = 0;
    try {
      for (let i = 0; i < toUpload.length; i += CHUNK) {
        const chunk = toUpload.slice(i, i + CHUNK);
        const res = await fetch("/api/organiser/potential-users/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: chunk,
            source: source.trim() || "csv",
            fieldDefs: i === 0 ? fieldDefs : undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Import failed at row ${i}`);
        inserted += data.inserted ?? 0;
        skipped += data.skipped ?? 0;
        setProgress(
          Math.min(
            100,
            Math.round(((i + chunk.length) / toUpload.length) * 100),
          ),
        );
      }
      setResult({ inserted, skipped });
      setStep("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setStep("dedup");
    }
  };

  const downloadSample = () => {
    const csv =
      "firstName,lastName,email,company,phone,Job Title,Position,Gender,Region\n" +
      "Alex,Morgan,alex@example.com,Acme Ltd,+44 20 1234 5678,Director,Marketing Lead,Female,South West\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "potential-users-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  const steps = ["Upload", "Map columns", "Check duplicates", "Import"];
  const stepIndex =
    step === "upload" ? 0 : step === "map" ? 1 : step === "dedup" ? 2 : 3;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink/95 shadow-glass">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            {steps.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span
                  className={`font-semibold ${i === stepIndex ? "text-gold" : i < stepIndex ? "text-white/70" : "text-white/35"}`}
                >
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                )}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
              {error}
            </p>
          )}

          {step === "upload" && (
            <div>
              <p className="text-sm text-white/70">
                Upload a <strong className="text-white">.csv</strong> with a
                header row. You'll map columns and check for duplicates before
                anything is saved. Handles large files (~10k rows).
              </p>
              <button
                type="button"
                onClick={downloadSample}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-gold/50 hover:text-gold"
              >
                <Download className="h-4 w-4 text-gold" /> Download sample CSV
              </button>
              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  Source label — where these contacts came from
                </label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. csv, conference-2026, linkedin-export"
                  className={input}
                />
                <p className="mt-1 text-xs text-white/40">
                  Saved on every contact in this import (defaults to “csv”).
                </p>
              </div>
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-10 text-center transition-colors hover:border-gold/50">
                <Upload className="h-6 w-6 text-gold" />
                <span className="text-sm font-semibold text-white">
                  Choose a CSV file
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
              </label>
            </div>
          )}

          {step === "map" && (
            <div>
              <p className="mb-4 flex items-center gap-2 text-sm text-white/70">
                <FileText className="h-4 w-4 text-gold" /> {fileName} ·{" "}
                {rows.length} rows · {headers.length} columns
              </p>
              <div className="space-y-2">
                {headers.map((h) => (
                  <div
                    key={h}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-white/85">
                      {h}
                    </span>
                    <span className="text-white/30">→</span>
                    <select
                      value={mapping[h]}
                      onChange={(e) =>
                        setMapping((m) => ({
                          ...m,
                          [h]: e.target.value as Target,
                        }))
                      }
                      className={`${input} w-44`}
                    >
                      {KNOWN_TARGETS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {mapping[h] === "custom" && (
                      <span className="text-xs text-white/40">{`{{${slugify(h)}}}`}</span>
                    )}
                  </div>
                ))}
              </div>
              {!emailHeader && (
                <p className="mt-3 text-xs text-red-300">
                  One column must be mapped to Email.
                </p>
              )}
            </div>
          )}

          {step === "dedup" && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-white">
                  How to handle duplicates
                </p>
                <div className="space-y-2">
                  {(
                    [
                      [
                        "check",
                        "Skip duplicates",
                        "Detect duplicates on the columns below (within the file and against existing contacts) and don’t import them.",
                      ],
                      [
                        "allow",
                        "Allow duplicates",
                        "Import every valid row, even if it duplicates an existing contact.",
                      ],
                      [
                        "skip",
                        "Skip duplicate check",
                        "Import all valid rows without checking — fastest.",
                      ],
                    ] as [Mode, string, string][]
                  ).map(([val, label, desc]) => (
                    <label
                      key={val}
                      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 ${mode === val ? "border-gold/50 bg-gold/[0.06]" : "border-white/10 hover:border-white/25"}`}
                    >
                      <input
                        type="radio"
                        name="dupmode"
                        checked={mode === val}
                        onChange={() => {
                          setMode(val);
                          setScan(null);
                        }}
                        className="mt-0.5 h-4 w-4 accent-[#caa24a]"
                      />
                      <span>
                        <span className="text-sm font-semibold text-white">
                          {label}
                        </span>
                        <br />
                        <span className="text-xs text-white/55">{desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {mode === "check" && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-white">
                    Match duplicates on
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchOptions.map((o) => {
                      const on = matchCols.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setScan(null);
                            setMatchCols((c) =>
                              on ? c.filter((x) => x !== o.id) : [...c, o.id],
                            );
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "border-gold/50 bg-gold/10 text-white" : "border-white/15 text-white/60 hover:border-white/30"}`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => runScan()}
                    disabled={scanning}
                    className="mt-3 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white hover:border-gold/40 disabled:opacity-60"
                  >
                    {scanning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}{" "}
                    Scan for duplicates
                  </button>
                  {scan && (
                    <p className="mt-3 text-sm text-white/70">
                      {scan.valid} valid rows ·{" "}
                      <span className="text-red-300">
                        {scan.inFile} in-file
                      </span>{" "}
                      +{" "}
                      <span className="text-red-300">
                        {scan.existing} existing
                      </span>{" "}
                      duplicates ·{" "}
                      <span className="text-gold">
                        {scan.toImport} will import
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-gold" />
              <p className="mt-3 text-sm text-white/70">
                Importing… {progress}%
              </p>
              <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold-gradient transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-gold" />
              <h3 className="mt-3 font-display text-xl font-semibold text-white">
                Import complete
              </h3>
              <p className="mt-2 text-sm text-white/70">
                {result.inserted} added
                {result.skipped > 0 &&
                  ` · ${result.skipped} skipped (invalid email)`}
                .
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40"
          >
            {step === "done" ? "Close" : "Cancel"}
          </button>
          <div className="flex gap-2">
            {step === "map" && (
              <button
                type="button"
                onClick={goToDedup}
                disabled={!emailHeader}
                className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === "dedup" && (
              <button
                type="button"
                onClick={doImport}
                className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold"
              >
                Import
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
