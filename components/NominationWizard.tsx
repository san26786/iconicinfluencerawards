"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Link2,
  PartyPopper,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  AWARD_CATEGORIES,
  NOMINATION_API_URL,
  NOMINATION_STORAGE_KEY,
} from "@/lib/content";

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadedFile = { name: string; size: number; type: string; url: string };

type WizardState = {
  // Step 1 – Nominee Details
  selfNominate: boolean;
  yourFirstName: string;
  yourLastName: string;
  yourEmail: string;
  yourMobile: string;
  yourWorkPhone: string;
  // Step 2 – Categories
  awardCategories: string[];
  // Step 3 – Business
  yourBusinessName: string;
  yourBusinessLocation: string;
  yourBusinessCategory: string;
  nomineePostCode: string;
  // Step 4 – Story
  openingStatement: string;
  linkedInProfile: string;
  videoLink: string;
  // Step 5 – Nominator Details
  nominatorTitle: string;
  nominatorFirstName: string;
  nominatorLastName: string;
  nominatorEmail: string;
  nominatorMobile: string;
  nominatorBusinessName: string;
  nominatorJobTitle: string;
  // Step 6 – Confirm
  anonymous: "" | "yes" | "no";
  howHeard: string;
  agreedToTerms: boolean;
};

const INITIAL: WizardState = {
  selfNominate: true,
  yourFirstName: "",
  yourLastName: "",
  yourEmail: "",
  yourMobile: "",
  yourWorkPhone: "",
  awardCategories: [],
  yourBusinessName: "",
  yourBusinessLocation: "",
  yourBusinessCategory: "",
  nomineePostCode: "",
  openingStatement: "",
  linkedInProfile: "",
  videoLink: "",
  nominatorTitle: "",
  nominatorFirstName: "",
  nominatorLastName: "",
  nominatorEmail: "",
  nominatorMobile: "",
  nominatorBusinessName: "",
  nominatorJobTitle: "",
  anonymous: "",
  howHeard: "Email",
  agreedToTerms: false,
};

const INDUSTRIES = [
  "Hospitality & Dining",
  "Retail & E-commerce",
  "Professional Services",
  "Technology & Digital",
  "Education & Training",
  "Healthcare & Wellbeing",
  "Construction & Property",
  "Creative & Media",
  "Manufacturing",
  "Charity & Non-profit",
  "Finance & Insurance",
  "Other",
];

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Rev", "Sir", "Other"];

const DRAFT_KEY = "sea_wizard_draft_v1";
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// ─── Category index ───────────────────────────────────────────────────────────
const CATEGORY_INDEX: { name: string; theme: string }[] =
  AWARD_CATEGORIES.flatMap((g) =>
    [...g.popular, ...g.prime, ...g.more].map((name) => ({
      name,
      theme: g.name,
    }))
  );
const NAME_SET = new Set(CATEGORY_INDEX.map((c) => c.name));

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadAttachment(file: File): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/nominate/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  const { url } = await res.json();
  return { name: file.name, size: file.size, type: file.type, url };
}

// ─── Reusable UI atoms ────────────────────────────────────────────────────────
const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-widest text-white/50"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-white/35 leading-relaxed">{hint}</p>}
    </div>
  );
}

// ─── Category picker (compact chip + search) ──────────────────────────────────
function CategoryPicker({
  selected,
  onToggle,
  onRemove,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const groupedOptions = AWARD_CATEGORIES.map((group) => ({
    theme: group.name,
    categories: [...group.popular, ...group.prime, ...group.more].filter(
      (name) =>
        !selected.includes(name) &&
        (!normalizedQuery || name.toLowerCase().includes(normalizedQuery)),
    ),
  })).filter((group) => group.categories.length > 0);

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold"
            >
              <Star className="h-3 w-3" />
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                className="ml-0.5 rounded-full p-0.5 text-gold/60 transition-colors hover:bg-gold/20 hover:text-gold"
                aria-label={`Remove ${name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add more button */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-sm text-white/50 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Plus className="h-4 w-4" />
          Add {selected.length > 0 ? "more" : ""} award categories
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0d2030] shadow-2xl">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {groupedOptions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-white/40">
                  No categories found
                </p>
              ) : (
                groupedOptions.map((group) => (
                  <div key={group.theme}>
                    <p className="sticky top-0 border-y border-white/[0.06] bg-[#0d2030] px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
                      {group.theme}
                    </p>
                    {group.categories.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          onToggle(name);
                          setQuery("");
                        }}
                        className="flex w-full items-start px-4 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <span className="text-sm text-white/85">{name}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom select dropdown (avoids native white-on-white on Windows) ────────
function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" id={id}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputBase} flex items-center justify-between pr-10 text-left ${
          value ? "text-white" : "text-white/35"
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0b1f2e] py-1.5 shadow-2xl">
          <div className="max-h-56 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                  value === opt ? "text-gold" : "text-white/80"
                }`}
              >
                {value === opt && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                <span className={value === opt ? "ml-0" : "ml-5"}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── File upload atom ─────────────────────────────────────────────────────────
function FileUploadField({
  label,
  accept,
  maxBytes,
  files,
  onChange,
  icon: Icon,
}: {
  label: string;
  accept: string;
  maxBytes: number;
  files: File[];
  onChange: (files: File[]) => void;
  icon: React.ElementType;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > maxBytes) {
      setSizeError(`File too large — max ${Math.round(maxBytes / 1024 / 1024)} MB`);
      return;
    }
    setSizeError("");
    onChange([f]);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 text-sm transition-colors ${
          files.length
            ? "border-gold/40 bg-gold/[0.05] text-gold"
            : "border-white/15 text-white/45 hover:border-white/30 hover:text-white/65"
        }`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          {files[0] ? files[0].name : label}
        </span>
        {files.length > 0 && (
          <X
            className="ml-auto h-4 w-4 flex-shrink-0 text-white/40 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />
      {sizeError && (
        <p className="mt-1 text-xs text-red-400">{sizeError}</p>
      )}
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ name, siteName = 'the Awards' }: { name: string; siteName?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
        <PartyPopper className="h-10 w-10 text-ink" />
      </div>
      <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
        You&rsquo;re officially nominated!
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/60">
        Congratulations, {name || "there"}. Your nomination for the {siteName} has been received. Our judges will be in touch with next
        steps.
      </p>
      <div className="mx-auto mt-8 grid max-w-sm gap-3 sm:grid-cols-2">
        <a
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          Visit Homepage
        </a>
        <a
          href="/categories"
          className="btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          <Trophy className="h-4 w-4" />
          Browse Categories
        </a>
      </div>
    </div>
  );
}

// ─── Main wizard component ────────────────────────────────────────────────────
export function NominationWizard({ pfToken, siteName = 'the Awards' }: { pfToken?: string; siteName?: string }) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [prefillName, setPrefillName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const TOTAL_STEPS = 6;

  // ── Restore draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<WizardState & { step: number }>;
        const { step: savedStep, ...savedState } = draft;
        setState((s) => ({ ...s, ...savedState }));
        if (savedStep && savedStep > 1 && savedStep <= TOTAL_STEPS) {
          setStep(savedStep);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ── Prefill categories handed off via sessionStorage by the Categories
  //    explorer / Find My Award "Nominate" + "Nominate All" buttons. Merged
  //    on top of any restored draft and consumed on read so a refresh is clean.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(NOMINATION_STORAGE_KEY);
      if (!stored) return;
      sessionStorage.removeItem(NOMINATION_STORAGE_KEY);
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const incoming = parsed.filter(
        (c: unknown): c is string => typeof c === "string" && NAME_SET.has(c),
      );
      if (!incoming.length) return;
      setState((s) => ({
        ...s,
        awardCategories: Array.from(
          new Set([...s.awardCategories, ...incoming]),
        ),
      }));
    } catch {
      /* sessionStorage unavailable — nothing to prefill */
    }
  }, []);

  // ── Prefill from token
  useEffect(() => {
    const url = pfToken
      ? `/api/prefill?t=${encodeURIComponent(pfToken)}`
      : "/api/prefill";
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const p = d?.prefill;
        if (!p) return;
        const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
        if (fullName) setPrefillName(fullName);
        setState((s) => ({
          ...s,
          yourFirstName: s.yourFirstName || p.firstName || "",
          yourLastName: s.yourLastName || p.lastName || "",
          yourEmail: s.yourEmail || p.email || "",
          yourMobile: s.yourMobile || p.mobile || "",
          yourBusinessName: s.yourBusinessName || p.businessName || "",
          yourBusinessLocation: s.yourBusinessLocation || p.businessLocation || "",
          yourBusinessCategory: s.yourBusinessCategory || p.businessCategory || "",
          awardCategories:
            s.awardCategories.length > 0
              ? s.awardCategories
              : Array.isArray(p.categories)
              ? p.categories.filter(
                  (c: unknown): c is string =>
                    typeof c === "string" && NAME_SET.has(c)
                )
              : [],
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pfToken]);

  // ── Save draft on every state/step change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, step }));
    } catch {
      /* ignore */
    }
  }, [state, step]);

  const set =
    <K extends keyof WizardState>(k: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setState((s) => ({ ...s, [k]: e.target.value as WizardState[K] }));

  const toggleCategory = (name: string) =>
    setState((s) => ({
      ...s,
      awardCategories: s.awardCategories.includes(name)
        ? s.awardCategories.filter((c) => c !== name)
        : [...s.awardCategories, name],
    }));

  const removeCategory = (name: string) =>
    setState((s) => ({
      ...s,
      awardCategories: s.awardCategories.filter((c) => c !== name),
    }));

  const scrollTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  // ── Per-step validation
  const validateStep = (): string => {
    if (step === 1) {
      if (!state.yourFirstName.trim() || !state.yourLastName.trim())
        return "Please enter the nominee's first and last name.";
      if (!emailOk(state.yourEmail))
        return "Please enter a valid email address.";
      if (!state.yourMobile.trim())
        return "Please enter the nominee's contact number.";
    }
    if (step === 2) {
      if (!state.yourBusinessName.trim())
        return "Please enter the nominee's business or organisation name.";
      if (!state.nomineePostCode.trim())
        return "Please enter the nominee's post code.";
    }
    if (step === 3) {
      if (state.awardCategories.length === 0)
        return "Please select at least one award category to continue.";
    }
    if (step === 4) {
      if (!state.openingStatement.trim() || state.openingStatement.trim().length < 30)
        return "Please tell us about your achievements — at least a sentence or two.";
    }
    if (step === 5) {
      if (!state.nominatorTitle)
        return "Please select your title.";
      if (!state.nominatorFirstName.trim() || !state.nominatorLastName.trim())
        return "Please enter your first and last name.";
      if (!state.nominatorEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.nominatorEmail))
        return "Please enter a valid email address.";
      if (!state.nominatorMobile.trim())
        return "Please enter your contact number.";
    }
    if (step === 6) {
      if (!state.anonymous)
        return "Please let us know whether you'd like to remain anonymous during judging.";
      if (!state.agreedToTerms)
        return "Please agree to the nomination terms and conditions.";
    }
    return "";
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    scrollTop();
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
    scrollTop();
  };

  // ── Final submission
  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);

    let docMeta: UploadedFile[] = [];
    let videoMeta: UploadedFile[] = [];
    let photoMeta: UploadedFile | null = null;
    try {
      if (docFiles[0]) docMeta = [await uploadAttachment(docFiles[0])];
      if (videoFiles[0]) videoMeta = [await uploadAttachment(videoFiles[0])];
      if (photoFiles[0]) photoMeta = await uploadAttachment(photoFiles[0]);
    } catch (uploadErr) {
      setError(
        `Could not upload your file. ${
          uploadErr instanceof Error ? uploadErr.message : "Please try a smaller file."
        }`
      );
      setSubmitting(false);
      return;
    }

    const photo = photoMeta
      ? { name: photoMeta.name, type: photoMeta.type, url: photoMeta.url }
      : undefined;

    const nominee = {
      firstName: state.yourFirstName,
      lastName: state.yourLastName,
      email: state.yourEmail,
      mobile: state.yourMobile,
      workPhone: state.yourWorkPhone,
      organisation: state.yourBusinessName,
      postCode: state.nomineePostCode,
      anonymous: state.anonymous === "yes",
      openingStatement: state.openingStatement,
      linkedIn: state.linkedInProfile,
      howHeard: state.howHeard || "Email",
      photo,
    };

    const payload = {
      // The site this nomination actually came from — NOT a build-time constant,
      // or every tenant's submissions get filed under one brand.
      site: siteName,
      submittedAt: new Date().toISOString(),
      awardCategories: state.awardCategories,
      selfNominate: state.selfNominate,
      nominee,
      nominator: {
        title: state.nominatorTitle,
        firstName: state.nominatorFirstName,
        lastName: state.nominatorLastName,
        email: state.nominatorEmail,
        mobile: state.nominatorMobile,
        businessName: state.nominatorBusinessName,
        jobTitle: state.nominatorJobTitle,
      },
      supporting: {
        documents: docMeta,
        videos: videoMeta,
        videoLink: state.videoLink,
      },
      agreedToTerms: state.agreedToTerms,
    };

    try {
      const res = await fetch(NOMINATION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Server error (${res.status})`);
      }
      // Clear draft
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setSent(true);
      scrollTop();
    } catch (submitErr) {
      setError(
        submitErr instanceof Error
          ? `Could not submit: ${submitErr.message}`
          : "Could not submit right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) return <SuccessScreen name={state.yourFirstName} siteName={siteName} />;

  const displayName = prefillName || state.yourFirstName || "there";

  return (
    <div ref={topRef} className="relative">
      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Nominee Details ─────────────────────────────────────── */}
      {step === 1 && (
        <StepWrapper
          icon={<CheckCircle2 className="h-7 w-7 text-ink" />}
          eyebrow="Step 1 · Nominee Details"
          title="Confirm Nominee contact details"
          subtitle="We've pre-filled what we have — please check everything is correct and add any missing information."
          topRight={
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70 select-none">
              <div
                aria-hidden="true"
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  state.selfNominate ? "border-gold bg-gold" : "border-white/30 bg-transparent"
                }`}
              >
                {state.selfNominate && <Check className="h-2.5 w-2.5 text-ink" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={state.selfNominate}
                onChange={(e) => setState((s) => ({ ...s, selfNominate: e.target.checked }))}
              />
              Self nominate
            </label>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nominee First name *" htmlFor="firstName">
              <input
                id="firstName"
                value={state.yourFirstName}
                onChange={set("yourFirstName")}
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Last name *" htmlFor="lastName">
              <input
                id="lastName"
                value={state.yourLastName}
                onChange={set("yourLastName")}
                type="text"
                autoComplete="family-name"
                placeholder="Smith"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Email address *" htmlFor="email">
              <input
                id="email"
                value={state.yourEmail}
                onChange={set("yourEmail")}
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Contact Number / Mobile Number *" htmlFor="mobile">
              <input
                id="mobile"
                value={state.yourMobile}
                onChange={set("yourMobile")}
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 000000"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Work Phone" htmlFor="workPhone" hint="Optional">
              <input
                id="workPhone"
                value={state.yourWorkPhone}
                onChange={set("yourWorkPhone")}
                type="tel"
                autoComplete="tel"
                placeholder="+44 20 0000 0000"
                className={inputBase}
              />
            </Field>
            <Field
              label="LinkedIn Profile"
              htmlFor="linkedin"
              hint="Optional — helps judges learn more about the nominee."
            >
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  id="linkedin"
                  value={state.linkedInProfile}
                  onChange={set("linkedInProfile")}
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  className={`${inputBase} pl-9`}
                />
              </div>
            </Field>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck className="h-4 w-4 text-gold/60" />
              Your details are securely stored and used only for this nomination.
            </div>
          </div>
        </StepWrapper>
      )}

      {/* ── STEP 2: About Nominee Business ─────────────────────────────── */}
      {step === 2 && (
        <StepWrapper
          icon={<Sparkles className="h-7 w-7 text-ink" />}
          eyebrow="Step 2 · About Nominee Business"
          title="Tell us about Nominee business"
          subtitle="Help our judges understand the context behind this nomination."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nominee Business / Organisation Name *"
              htmlFor="bizName"
            >
              <input
                id="bizName"
                value={state.yourBusinessName}
                onChange={set("yourBusinessName")}
                type="text"
                placeholder="Acme Ltd"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Business Location (City / Town) *" htmlFor="bizLocation">
              <input
                id="bizLocation"
                value={state.yourBusinessLocation}
                onChange={set("yourBusinessLocation")}
                type="text"
                placeholder="London"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Industry" htmlFor="bizCat">
              <SelectField
                id="bizCat"
                value={state.yourBusinessCategory}
                onChange={(v) => setState((s) => ({ ...s, yourBusinessCategory: v }))}
                options={INDUSTRIES}
                placeholder="Select industry…"
              />
            </Field>
            <Field label="Nominee Post Code" htmlFor="postCode">
              <input
                id="postCode"
                value={state.nomineePostCode}
                onChange={set("nomineePostCode")}
                type="text"
                placeholder="EC1A 1BB"
                className={inputBase}
              />
            </Field>
          </div>
        </StepWrapper>
      )}

      {/* ── STEP 3: Award Categories ────────────────────────────────────── */}
      {step === 3 && (
        <StepWrapper
          icon={<Trophy className="h-7 w-7 text-ink" />}
          eyebrow="Step 3 · Your Awards"
          title={
            pfToken
              ? `You've been nominated, ${displayName}!`
              : "Choose your award categories"
          }
          subtitle={
            pfToken
              ? "Your organiser has already selected categories for you — review them below and add more if you like. This is completely free."
              : "Select every category that reflects your achievements. You can enter as many as you like at no cost."
          }
        >
          {pfToken && (
            <div className="mb-6 rounded-xl border border-gold/25 bg-gold/[0.07] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-white/90">
                    Your nomination is waiting for you
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">
                    The awards team has nominated you based on your outstanding
                    reputation. Complete this form to confirm — it only takes a few
                    minutes and it&rsquo;s completely free.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Field label="Selected award categories *" htmlFor="cats">
            <CategoryPicker
              selected={state.awardCategories}
              onToggle={toggleCategory}
              onRemove={removeCategory}
            />
            {state.awardCategories.length === 0 && (
              <p className="mt-2 text-xs text-white/35">
                No categories selected yet — click &ldquo;Add award categories&rdquo; above.
              </p>
            )}
          </Field>

          {/* Social proof */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Star, label: "60+", sub: "award categories" },
              { icon: Trophy, label: "Free to enter", sub: "no fees, ever" },
              { icon: ShieldCheck, label: "Independent", sub: "expert judging panel" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center"
              >
                <item.icon className="mx-auto mb-1.5 h-5 w-5 text-gold" />
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-white/40">{item.sub}</p>
              </div>
            ))}
          </div>
        </StepWrapper>
      )}

      {/* ── STEP 4: Your Story ──────────────────────────────────────────── */}
      {step === 4 && (
        <StepWrapper
          icon={<Star className="h-7 w-7 text-ink" />}
          eyebrow="Step 4 · Your Story"
          title="Why do you deserve recognition?"
          subtitle="This is your moment to shine. Our independent judges read every word — be specific, be proud, be you."
        >
          <div className="space-y-4">
            <Field
              label="Your achievement statement *"
              htmlFor="statement"
              hint="Describe what makes your business exceptional — key milestones, community impact, innovation, growth. Aim for 2–4 sentences."
            >
              <textarea
                id="statement"
                value={state.openingStatement}
                onChange={set("openingStatement")}
                rows={5}
                placeholder="Over the past year we have… our team has achieved… our customers say…"
                className={`${inputBase} resize-none leading-relaxed`}
              />
              <div className="text-right">
                <span
                  className={`text-xs ${
                    state.openingStatement.length < 30
                      ? "text-white/30"
                      : "text-gold/60"
                  }`}
                >
                  {state.openingStatement.length} characters
                </span>
              </div>
            </Field>

            <Field
              label="Supporting video link"
              htmlFor="videoLink"
              hint="Optional — YouTube or Vimeo link to a pitch, testimonial, or product demo."
            >
              <div className="relative">
                <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  id="videoLink"
                  value={state.videoLink}
                  onChange={set("videoLink")}
                  type="url"
                  placeholder="https://youtube.com/watch?v=…"
                  className={`${inputBase} pl-9`}
                />
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Supporting document"
                htmlFor="doc"
                hint="Optional — PDF or Word, max 10 MB"
              >
                <FileUploadField
                  label="Upload document…"
                  accept=".pdf,.doc,.docx"
                  maxBytes={MAX_DOC_BYTES}
                  files={docFiles}
                  onChange={setDocFiles}
                  icon={FileText}
                />
              </Field>
              <Field
                label="Video file"
                htmlFor="video"
                hint="Optional — MP4 or MOV, max 50 MB"
              >
                <FileUploadField
                  label="Upload video…"
                  accept="video/*"
                  maxBytes={MAX_VIDEO_BYTES}
                  files={videoFiles}
                  onChange={setVideoFiles}
                  icon={Upload}
                />
              </Field>
            </div>
          </div>
        </StepWrapper>
      )}

      {/* ── STEP 5: Nominator Details ───────────────────────────────────── */}
      {step === 5 && (
        <StepWrapper
          icon={<CheckCircle2 className="h-7 w-7 text-ink" />}
          eyebrow="Step 5 · Nominator Details"
          title="Your details as Nominator"
          subtitle="Tell us about yourself — the person submitting this nomination."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Title *" htmlFor="nomTitle">
              <SelectField
                id="nomTitle"
                value={state.nominatorTitle}
                onChange={(v) => setState((s) => ({ ...s, nominatorTitle: v }))}
                options={TITLES}
                placeholder="Select title…"
              />
            </Field>
            <Field label="First Name *" htmlFor="nomFirst">
              <input
                id="nomFirst"
                value={state.nominatorFirstName}
                onChange={set("nominatorFirstName")}
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                className={inputBase}
              />
            </Field>
            <Field label="Last Name *" htmlFor="nomLast">
              <input
                id="nomLast"
                value={state.nominatorLastName}
                onChange={set("nominatorLastName")}
                type="text"
                autoComplete="family-name"
                placeholder="Smith"
                className={inputBase}
              />
            </Field>
            <Field label="Your Email *" htmlFor="nomEmail">
              <input
                id="nomEmail"
                value={state.nominatorEmail}
                onChange={set("nominatorEmail")}
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                className={inputBase}
              />
            </Field>
            <Field label="Your Contact Number / Mobile *" htmlFor="nomMobile">
              <input
                id="nomMobile"
                value={state.nominatorMobile}
                onChange={set("nominatorMobile")}
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 000000"
                className={inputBase}
              />
            </Field>
            <Field label="Your Business Name" htmlFor="nomBiz">
              <input
                id="nomBiz"
                value={state.nominatorBusinessName}
                onChange={set("nominatorBusinessName")}
                type="text"
                placeholder="Acme Ltd"
                className={inputBase}
              />
            </Field>
            <Field label="Your Job Title" htmlFor="nomJob">
              <input
                id="nomJob"
                value={state.nominatorJobTitle}
                onChange={set("nominatorJobTitle")}
                type="text"
                placeholder="Managing Director"
                className={inputBase}
              />
            </Field>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck className="h-4 w-4 text-gold/60" />
              Your details are securely stored and used only for this nomination.
            </div>
          </div>
        </StepWrapper>
      )}

      {/* ── STEP 6: Review & Confirm ────────────────────────────────────── */}
      {step === 6 && (
        <StepWrapper
          icon={<PartyPopper className="h-7 w-7 text-ink" />}
          eyebrow="Step 6 · Almost There"
          title="Review and confirm"
          subtitle="One last check — then you're done. Your nomination is completely free."
        >
          {/* Summary card */}
          <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
              Your nomination summary
            </h3>
            <SummaryRow label="Name" value={`${state.yourFirstName} ${state.yourLastName}`} />
            <SummaryRow label="Email" value={state.yourEmail} />
            <SummaryRow label="Business" value={state.yourBusinessName} />
            <SummaryRow label="Location" value={`${state.yourBusinessLocation}${state.nomineePostCode ? `, ${state.nomineePostCode}` : ""}`} />
            <SummaryRow label="Industry" value={state.yourBusinessCategory} />
            <div>
              <p className="text-xs text-white/35 mb-1.5">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {state.awardCategories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-gold/30 bg-gold/[0.08] px-2.5 py-0.5 text-xs text-gold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Profile photo */}
          <Field
            label="Profile photo"
            htmlFor="photo"
            hint="Optional — helps put a face to your name for our judges. Max 5 MB."
          >
            <FileUploadField
              label="Upload profile photo…"
              accept="image/*"
              maxBytes={MAX_IMAGE_BYTES}
              files={photoFiles}
              onChange={setPhotoFiles}
              icon={Upload}
            />
          </Field>

          {/* Anonymous preference */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
              Anonymous during judging? *
            </p>
            <p className="mb-3 text-sm text-white/50 leading-relaxed">
              If yes, your name and business will not be shared with judges until
              after scoring is complete — only your story will be evaluated.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "yes", label: "Yes — keep me anonymous", icon: ShieldCheck },
                { value: "no", label: "No — share my details", icon: CheckCircle2 },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, anonymous: value as "yes" | "no" }))
                  }
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    state.anonymous === value
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* T&Cs */}
          <div className="mt-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-white/15">
              {/* Presentational box only — the wrapping <label> toggles the
                  hidden input. (Having its own onClick too double-fired the
                  toggle when the box itself was clicked, cancelling it out.) */}
              <div
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  state.agreedToTerms
                    ? "border-gold bg-gold"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {state.agreedToTerms && (
                  <Check className="h-3 w-3 text-ink font-bold" />
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={state.agreedToTerms}
                onChange={(e) =>
                  setState((s) => ({ ...s, agreedToTerms: e.target.checked }))
                }
              />
              <p className="text-sm leading-relaxed text-white/60">
                I confirm all information is accurate and I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline-offset-2 hover:underline"
                >
                  nomination terms and conditions
                </a>
                .
              </p>
            </label>
          </div>
        </StepWrapper>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={next}
            className="btn-primary flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
          >
            Save & continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                Submitting…
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                Complete My Nomination
              </>
            )}
          </button>
        )}
      </div>

      {/* Draft save notice */}
      <p className="mt-4 text-center text-xs text-white/25">
        Your progress is saved automatically — safe to close and come back later.
      </p>
    </div>
  );
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────
function StepWrapper({
  icon,
  eyebrow,
  title,
  subtitle,
  topRight,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Step header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-sm">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
              {eyebrow}
            </p>
            {topRight}
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.05] pb-2">
      <span className="text-xs text-white/35 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/80 text-right">{value}</span>
    </div>
  );
}
