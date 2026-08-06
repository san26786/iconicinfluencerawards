"use client";

// Full Award Nomination Form. Lays out the same sections as the original
// nomination flow (Choose Award Categories → Nominee → Supporting docs →
// Your info → T&C) and supports deep linking:
//   ?category=<name>          — pre-selects a single award category
//   ?categories=a,b,c         — pre-selects multiple (used by "Nominate All")
//   ?mode=nominate            — preserved for backwards compat (always nominate-mode here)

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Camera,
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
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  AWARD_CATEGORIES,
  NOMINATION_API_URL,
  NOMINATION_STORAGE_KEY,
} from "@/lib/content";
import { useRouter } from "next/navigation";
// Attachment metadata persisted with a nomination — includes the public Blob
// URL so organisers can open the actual file later.
type UploadedFile = { name: string; size: number; type: string; url: string };

// Attachment size caps — kept modest so the nomination stays lightweight.
// Larger videos should be shared via the "Video Link" field instead. These are
// enforced again server-side in /api/nominate/upload.
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (nominee profile photo)
const fmtMb = (bytes: number) =>
  `${bytes % (1024 * 1024) === 0 ? bytes / (1024 * 1024) : (bytes / (1024 * 1024)).toFixed(1)} MB`;

// Upload via our own server-side route (avoids CORS restrictions on vercel.com).
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

// Build a flat lookup for category name → its theme name (used in the picker)
const CATEGORY_INDEX: { name: string; theme: string }[] =
  AWARD_CATEGORIES.flatMap((g) =>
    [...g.popular, ...g.prime, ...g.more].map((name) => ({
      name,
      theme: g.name,
    })),
  );
const ALL_NAMES = CATEGORY_INDEX.map((c) => c.name);
const NAME_SET = new Set(ALL_NAMES);

const HOW_HEARD = [
  "Flyer",
  "Email",
  "Nominated",
  "Sponsor",
  "Venus Ambassador",
  "Previous Applicant",
  "Google",
  "Facebook",
  "Twitter",
  "LinkedIn",
  "Website",
  "Other Social Media",
  "Networking Event",
  "Word Of Mouth",
  "Other",
];

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

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40";

type FormState = {
  awardCategories: string[];
  selfNominate: boolean;
  nomineeFirstName: string;
  nomineeLastName: string;
  nomineeEmail: string;
  nomineeMobile: string;
  nomineeWorkPhone: string;
  nomineeOrganisation: string;
  nomineePostCode: string;
  anonymous: "" | "yes" | "no";
  openingStatement: string;
  linkedInProfile: string;
  howHeard: string;
  videoLink: string;
  yourFirstName: string;
  yourLastName: string;
  yourEmail: string;
  yourMobile: string;
  yourWorkPhone: string;
  yourBusinessName: string;
  yourBusinessLocation: string;
  yourBusinessCategory: string;
  agreedToTerms: boolean;
};

const INITIAL: FormState = {
  awardCategories: [],
  selfNominate: false,
  nomineeFirstName: "",
  nomineeLastName: "",
  nomineeEmail: "",
  nomineeMobile: "",
  nomineeWorkPhone: "",
  nomineeOrganisation: "",
  nomineePostCode: "",
  anonymous: "",
  openingStatement: "",
  linkedInProfile: "",
  howHeard: "",
  videoLink: "",
  yourFirstName: "",
  yourLastName: "",
  yourEmail: "",
  yourMobile: "",
  yourWorkPhone: "",
  yourBusinessName: "",
  yourBusinessLocation: "",
  yourBusinessCategory: "",
  agreedToTerms: false,
};

type FileMeta = { name: string; size: number; type: string };

type RegisterFormProps = {
  // 'create' = public submission (default). 'edit' = organiser updating an
  // existing nomination — the SAME form, pre-filled, saved via PATCH.
  mode?: "create" | "edit";
  nominationId?: number;
  initial?: Partial<FormState>;
  initialSupporting?: { documents?: FileMeta[]; videos?: FileMeta[] };
  // Where edit-mode PATCHes go, and where the success screen links back to.
  // Default to the organiser routes for backwards compatibility.
  editEndpoint?: string;
  editBackHref?: string;
  editViewHref?: string;
  /**
   * Name of the site this form is being filled in on, stamped onto the
   * submission. Passed in because this is a client component and can't read
   * the per-request site itself.
   */
  siteName?: string;
};

export function RegisterForm({
  mode = "create",
  nominationId,
  initial,
  initialSupporting,
  editEndpoint,
  editBackHref = "/organiser",
  editViewHref,
  siteName,
}: RegisterFormProps = {}) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => ({
    ...INITIAL,
    ...(initial ?? {}),
  }));
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [showSupporting, setShowSupporting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Opened from an email {{nominationLink}} (?pf=…). In this mode the recipient
  // is confirming their OWN nomination, so self-nominate is forced on and its
  // toggle is hidden from the form.
  const [fromPrefill, setFromPrefill] = useState(false);

  // Pre-populate the award category list from (in priority order):
  //   1. sessionStorage — preferred handoff from Categories page / Find My Award
  //      ("Nominate" and "Nominate All" handlers write the picks there)
  //   2. ?category=<name>       URL param  (single)
  //   3. ?categories=a,b,c     URL param  (multiple — used by the Find My
  //                                        Award results email so the
  //                                        "Nominate All" link in the inbox
  //                                        opens the form with everything
  //                                        pre-selected)
  // The sessionStorage value is consumed on read so a refresh starts fresh.
  useEffect(() => {
    if (isEdit) return; // edit mode is pre-filled from props — skip URL/session prefill
    const incoming: string[] = [];

    try {
      const stored = sessionStorage.getItem(NOMINATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed))
          incoming.push(...parsed.filter((x) => typeof x === "string"));
        sessionStorage.removeItem(NOMINATION_STORAGE_KEY);
      }
    } catch {
      /* sessionStorage unavailable — fine, fall through to URL params */
    }

    const params = new URLSearchParams(window.location.search);
    const single = params.get("category");
    if (single) incoming.push(single);

    // Plural: ?categories=Cat+A,Cat+B,Cat+C. URLSearchParams already URI-decodes
    // the value, so a single split on ',' is enough — no category name in the
    // taxonomy contains a literal comma.
    const multi = params.get("categories");
    if (multi) {
      incoming.push(
        ...multi
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      );
    }

    const valid = Array.from(new Set(incoming.filter((c) => NAME_SET.has(c))));
    if (valid.length) {
      setState((s) => ({ ...s, awardCategories: valid }));
    }
  }, [isEdit]);

  // Pre-fill the nominator ("Your Information") fields from an email prefill
  // token (?pf=…), or — failing that — the signed-in visitor's own profile.
  // Only fills fields the user hasn't already typed. Create-mode only.
  useEffect(() => {
    if (isEdit) return;
    const pf = new URLSearchParams(window.location.search).get("pf");
    // Opened from an email {{nominationLink}} → default to self-nominate and
    // anonymous so the recipient can confirm their own nomination in one go.
    if (pf) {
      setFromPrefill(true);
      setState((s) => ({
        ...s,
        selfNominate: true,
        anonymous: s.anonymous || "yes",
        // Prefill links come from our own emails, so "How did you hear" is known.
        // Preselect Email and hide the question below.
        howHeard: s.howHeard || "Email",
      }));
    }
    const url = pf
      ? `/api/prefill?t=${encodeURIComponent(pf)}`
      : "/api/prefill";
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const p = d?.prefill;
        if (cancelled || !p) return;
        setState((s) => ({
          ...s,
          yourFirstName: s.yourFirstName || p.firstName || "",
          yourLastName: s.yourLastName || p.lastName || "",
          yourEmail: s.yourEmail || p.email || "",
          yourMobile: s.yourMobile || p.mobile || "",
          yourBusinessName: s.yourBusinessName || p.businessName || "",
          yourBusinessLocation:
            s.yourBusinessLocation || p.businessLocation || "",
          yourBusinessCategory:
            s.yourBusinessCategory || p.businessCategory || "",
          awardCategories:
            s.awardCategories.length > 0
              ? s.awardCategories
              : Array.isArray(p.categories)
                ? p.categories.filter(
                    (c: unknown): c is string =>
                      typeof c === "string" && NAME_SET.has(c),
                  )
                : [],
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  const set =
    <K extends keyof FormState>(k: K) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setState((s) => ({ ...s, [k]: e.target.value as FormState[K] }));

  const setBool = (k: keyof FormState, v: boolean) =>
    setState((s) => ({ ...s, [k]: v as FormState[typeof k] }));

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

  const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (state.awardCategories.length === 0) {
      setError("Please choose at least one award category.");
      return;
    }
    // Personal identity — only required when nominating someone else
    if (!state.selfNominate) {
      if (!state.nomineeFirstName.trim() || !state.nomineeLastName.trim()) {
        setError("Please add the nominee’s first and last name.");
        return;
      }
      if (!emailOk(state.nomineeEmail)) {
        setError("Please add a valid email for the nominee.");
        return;
      }
      if (!state.nomineeMobile.trim()) {
        setError("Please add a mobile number for the nominee.");
        return;
      }
    }
    // Nomination details — always required (no equivalent in Your Information)
    if (!state.nomineePostCode.trim()) {
      setError(
        state.selfNominate
          ? "Please add your post code."
          : "Please add the nominee’s post code.",
      );
      return;
    }
    if (!state.anonymous) {
      setError(
        state.selfNominate
          ? "Please confirm whether you want to remain anonymous."
          : "Please confirm whether you want to nominate anonymously.",
      );
      return;
    }
    if (!state.openingStatement.trim()) {
      setError(
        state.selfNominate
          ? "Please tell us why you deserve to be recognised."
          : "Please add a short reason for the nomination.",
      );
      return;
    }
    if (!state.howHeard) {
      setError("Please tell us how you heard about us.");
      return;
    }
    if (!state.selfNominate) {
      if (!state.yourFirstName.trim() || !state.yourLastName.trim()) {
        setError("Please add your first and last name.");
        return;
      }
      if (!emailOk(state.yourEmail)) {
        setError("Please add a valid email for yourself.");
        return;
      }
      if (!state.yourBusinessName.trim()) {
        setError("Please add your business name.");
        return;
      }
      if (!state.yourBusinessLocation.trim()) {
        setError("Please add your business location.");
        return;
      }
      if (!state.yourBusinessCategory) {
        setError("Please pick your business category.");
        return;
      }
    }
    if (!state.agreedToTerms) {
      setError("Please agree to the nomination terms and conditions.");
      return;
    }

    setError("");
    setSubmitting(true);

    // Upload any newly-selected attachments straight to Vercel Blob from the
    // browser, then carry only their public URLs (+ metadata) in the payload —
    // this bypasses the serverless request-size limit entirely (no more 413).
    let docMeta: UploadedFile[] = [];
    let videoMeta: UploadedFile[] = [];
    let photoMeta: UploadedFile | null = null;
    try {
      if (docFiles[0]) docMeta = [await uploadAttachment(docFiles[0])];
      if (videoFiles[0]) videoMeta = [await uploadAttachment(videoFiles[0])];
      if (photoFiles[0]) photoMeta = await uploadAttachment(photoFiles[0]);
    } catch (err) {
      setError(
        `We could not upload your attachment. ${
          err instanceof Error
            ? err.message
            : "Please try a smaller file or remove it."
        }`,
      );
      setSubmitting(false);
      return;
    }

    const payload = buildNominationPayload(
      state,
      docFiles,
      videoFiles,
      photoMeta
        ? { name: photoMeta.name, type: photoMeta.type, url: photoMeta.url }
        : undefined,
      siteName,
    );

    // ── Edit mode (organiser): save via PATCH as JSON ─────────────────────
    if (isEdit) {
      // Keep the original attachment metadata unless new files were picked.
      payload.supporting = {
        documents: docFiles.length
          ? docMeta
          : (initialSupporting?.documents ?? []),
        videos: videoFiles.length
          ? videoMeta
          : (initialSupporting?.videos ?? []),
        videoLink: state.videoLink,
      };
      try {
        const res = await fetch(
          editEndpoint ?? `/api/organiser/nominations/${nominationId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          let detail = "";
          try {
            const j = await res.json();
            detail = j.error || "";
          } catch {
            /* ignore */
          }
          throw new Error(detail || `Save failed (${res.status})`);
        }
        setSent(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? `We could not save the changes. ${err.message}`
            : "We could not save the changes. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Carry the uploaded attachment URLs (+ metadata) with the nomination.
    payload.supporting = {
      documents: docMeta,
      videos: videoMeta,
      videoLink: state.videoLink,
    };

    // Submit as JSON — the files are already in Blob storage, so the request
    // body stays tiny (no 413 on large documents/videos).
    try {
      const res = await fetch(NOMINATION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Pull whatever the upstream said so the user sees a useful error
        // ("Server returned 403: invalid api key") rather than a generic one.
        const upstreamStatus =
          res.headers.get("X-Upstream-Status") ?? String(res.status);
        let detail = "";
        try {
          const txt = (await res.text()).trim();
          // If JSON with an "error" / "message" / "detail" field, prefer that
          try {
            const j = JSON.parse(txt);
            detail = j.message || j.error || j.detail || txt.slice(0, 200);
          } catch {
            detail = txt.slice(0, 200);
          }
        } catch {
          /* ignore */
        }
        throw new Error(
          `Server returned ${upstreamStatus}${detail ? ": " + detail : ""}`,
        );
      }

      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg
          ? `We could not submit your nomination. ${msg}`
          : "We could not submit your nomination right now. Please check your connection and try again, or contact us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    if (isEdit)
      return (
        <EditSuccess
          id={nominationId}
          backHref={editBackHref}
          viewHref={editViewHref}
        />
      );
    return (
      <Success
        state={state}
        onAnother={() => {
          setState(INITIAL);
          setSent(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <Section
        n="01"
        title="Nominee Information"
        subtitle={
          state.selfNominate ? "About you." : "Who do you want to nominate?"
        }
        right={
          // Hidden when the form was opened from an email {{nominationLink}} —
          // the recipient is nominating themselves, so self-nominate stays on.
          fromPrefill ? undefined : (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/70 transition-colors hover:text-gold">
              <input
                type="checkbox"
                checked={state.selfNominate}
                onChange={(e) => setBool("selfNominate", e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#D4AF37]"
              />
              Self nominate
            </label>
          )
        }
        required
      >
        {state.selfNominate && (
          <div className="mb-5 rounded-xl border border-gold/30 bg-gold/[0.06] p-4 text-sm text-white/75">
            Please confirm the personal details below and describe the
            achievements and contributions.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Identity — your own details when self-nominating, the nominee’s otherwise */}
          {/* {state.selfNominate ? (
            <>
              <Field label="Your First Name *" htmlFor="yFirstN">
                <input
                  id="yFirstN"
                  value={state.yourFirstName}
                  onChange={set("yourFirstName")}
                  type="text"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Last Name *" htmlFor="yLastN">
                <input
                  id="yLastN"
                  value={state.yourLastName}
                  onChange={set("yourLastName")}
                  type="text"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Email *" htmlFor="yEmailN">
                <input
                  id="yEmailN"
                  value={state.yourEmail}
                  onChange={set("yourEmail")}
                  type="email"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Mobile" htmlFor="yMobileN">
                <input
                  id="yMobileN"
                  value={state.yourMobile}
                  onChange={set("yourMobile")}
                  type="tel"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Work Phone" htmlFor="yWorkN">
                <input
                  id="yWorkN"
                  value={state.yourWorkPhone}
                  onChange={set("yourWorkPhone")}
                  type="tel"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Business Name *" htmlFor="yBizN">
                <input
                  id="yBizN"
                  value={state.yourBusinessName}
                  onChange={set("yourBusinessName")}
                  type="text"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Business Location *" htmlFor="yLocN">
                <input
                  id="yLocN"
                  value={state.yourBusinessLocation}
                  onChange={set("yourBusinessLocation")}
                  type="text"
                  placeholder="City, country"
                  className={inputBase}
                />
              </Field>
              <Field label="Your Business Category *" htmlFor="yCatN">
                <Select
                  id="yCatN"
                  value={state.yourBusinessCategory}
                  onChange={set("yourBusinessCategory")}
                  options={INDUSTRIES}
                  placeholder="Choose your sector"
                />
              </Field>
            </>
          ) : ( */}
          <>
            <Field label="Nominee First Name *" htmlFor="nFirst">
              <input
                id="nFirst"
                value={state.nomineeFirstName}
                onChange={set("nomineeFirstName")}
                type="text"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Last Name *" htmlFor="nLast">
              <input
                id="nLast"
                value={state.nomineeLastName}
                onChange={set("nomineeLastName")}
                type="text"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Email *" htmlFor="nEmail">
              <input
                id="nEmail"
                value={state.nomineeEmail}
                onChange={set("nomineeEmail")}
                type="email"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Mobile *" htmlFor="nMobile">
              <input
                id="nMobile"
                value={state.nomineeMobile}
                onChange={set("nomineeMobile")}
                type="tel"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Work Phone" htmlFor="nWork">
              <input
                id="nWork"
                value={state.nomineeWorkPhone}
                onChange={set("nomineeWorkPhone")}
                type="tel"
                className={inputBase}
              />
            </Field>
            <Field label="Nominee Organisation" htmlFor="nOrg">
              <input
                id="nOrg"
                value={state.nomineeOrganisation}
                onChange={set("nomineeOrganisation")}
                type="text"
                className={inputBase}
              />
            </Field>
          </>
          {/* )} */}

          {/* Nomination details — always collected (these have no equivalent in Your Information) */}
          <Field
            label={
              state.selfNominate ? "Your Post Code *" : "Nominee Post Code *"
            }
            htmlFor="nPost"
          >
            <input
              id="nPost"
              value={state.nomineePostCode}
              onChange={set("nomineePostCode")}
              type="text"
              className={inputBase}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label={
                state.selfNominate
                  ? "Opening statement / Why you deserve to win *"
                  : "Opening statement / Reason(s) for nomination *"
              }
              htmlFor="nReason"
            >
              <textarea
                id="nReason"
                value={state.openingStatement}
                onChange={set("openingStatement")}
                rows={5}
                placeholder={
                  state.selfNominate
                    ? "In a few sentences, tell us why you deserve to be recognised."
                    : "In a few sentences, tell us why this nominee deserves to be recognised."
                }
                className={`${inputBase} resize-none`}
              />
            </Field>
          </div>
          <Field
            label={
              state.selfNominate
                ? "Your LinkedIn Profile"
                : "Nominee LinkedIn Profile"
            }
            htmlFor="nLi"
          >
            <input
              id="nLi"
              value={state.linkedInProfile}
              onChange={set("linkedInProfile")}
              type="url"
              placeholder="https://linkedin.com/in/…"
              className={inputBase}
            />
          </Field>
          {/* Hidden for email prefill links — howHeard is preset to "Email". */}
          {!fromPrefill && (
            <Field label="How did you hear about us? *" htmlFor="nHeard">
              <Select
                id="nHeard"
                value={state.howHeard}
                onChange={set("howHeard")}
                options={HOW_HEARD}
                placeholder="Choose an option"
              />
            </Field>
          )}
          <div className="sm:col-span-2">
            <FileField
              icon={Camera}
              label={
                state.selfNominate
                  ? "Your Profile Photo"
                  : "Nominee Profile Photo"
              }
              hint={`A clear headshot — JPG or PNG · max ${fmtMb(MAX_IMAGE_BYTES)} (optional)`}
              accept="image/*"
              maxBytes={MAX_IMAGE_BYTES}
              files={photoFiles}
              onAdd={(f) => setPhotoFiles(f.slice(0, 1))}
              onRemove={() => setPhotoFiles([])}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSupporting((v) => !v)}
          className="group relative mt-6 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold tracking-wide text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          aria-expanded={showSupporting}
        >
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <Plus
            className={`relative z-10 h-4 w-4 transition-transform ${showSupporting ? "rotate-45" : ""}`}
          />
          <span className="relative z-10">
            {showSupporting
              ? "Hide additional information and documents"
              : "Click here to submit additional information and documents"}
          </span>
        </button>
      </Section>

      {showSupporting && (
        <Section
          n="02"
          title="Supporting Statement And Material"
          subtitle="Optional — add documents or a video that strengthens the nomination."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              icon={FileText}
              label="Upload Document"
              hint={`One PDF or Word file · max ${fmtMb(MAX_DOC_BYTES)}`}
              accept=".pdf,.doc,.docx"
              maxBytes={MAX_DOC_BYTES}
              files={docFiles}
              onAdd={(f) => setDocFiles(f.slice(0, 1))}
              onRemove={() => setDocFiles([])}
            />
            <FileField
              icon={Video}
              label="Upload Video"
              hint={`One video file · max ${fmtMb(MAX_VIDEO_BYTES)} (use Video Link for larger)`}
              accept="video/*"
              maxBytes={MAX_VIDEO_BYTES}
              files={videoFiles}
              onAdd={(f) => setVideoFiles(f.slice(0, 1))}
              onRemove={() => setVideoFiles([])}
            />
            <div className="sm:col-span-2">
              <Field label="Video Link" htmlFor="videoLink" icon={Link2}>
                <input
                  id="videoLink"
                  value={state.videoLink}
                  onChange={set("videoLink")}
                  type="url"
                  placeholder="https://… (YouTube, Vimeo, etc.)"
                  className={inputBase}
                />
              </Field>
            </div>
          </div>
        </Section>
      )}

      <Section
        n={showSupporting ? "03" : "02"}
        title="Choose Your Award Categories"
        subtitle="Pick one or more categories your nomination should be considered for."
        required
      >
        <AwardCategoryPicker
          selected={state.awardCategories}
          onToggle={toggleCategory}
          onRemove={removeCategory}
        />
      </Section>

      {!state.selfNominate && (
        <Section
          n={showSupporting ? "04" : "03"}
          title="Your Information"
          subtitle="About yourself — so we can confirm the nomination."
          required
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your First Name *" htmlFor="yFirst">
              <input
                id="yFirst"
                value={state.yourFirstName}
                onChange={set("yourFirstName")}
                type="text"
                className={inputBase}
              />
            </Field>
            <Field label="Your Last Name *" htmlFor="yLast">
              <input
                id="yLast"
                value={state.yourLastName}
                onChange={set("yourLastName")}
                type="text"
                className={inputBase}
              />
            </Field>
            <Field label="Your Email *" htmlFor="yEmail">
              <input
                id="yEmail"
                value={state.yourEmail}
                onChange={set("yourEmail")}
                type="email"
                className={inputBase}
              />
            </Field>
            <Field label="Your Mobile" htmlFor="yMobile">
              <input
                id="yMobile"
                value={state.yourMobile}
                onChange={set("yourMobile")}
                type="tel"
                className={inputBase}
              />
            </Field>
            <Field label="Your Work Phone" htmlFor="yWork">
              <input
                id="yWork"
                value={state.yourWorkPhone}
                onChange={set("yourWorkPhone")}
                type="tel"
                className={inputBase}
              />
            </Field>
            <Field label="Your Business Name *" htmlFor="yBiz">
              <input
                id="yBiz"
                value={state.yourBusinessName}
                onChange={set("yourBusinessName")}
                type="text"
                className={inputBase}
              />
            </Field>
            <Field label="Your Business Location *" htmlFor="yLoc">
              <input
                id="yLoc"
                value={state.yourBusinessLocation}
                onChange={set("yourBusinessLocation")}
                type="text"
                placeholder="City, country"
                className={inputBase}
              />
            </Field>
            <Field label="Your Business Category *" htmlFor="yCat">
              <Select
                id="yCat"
                value={state.yourBusinessCategory}
                onChange={set("yourBusinessCategory")}
                options={INDUSTRIES}
                placeholder="Choose your sector"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Do you want to nominate anonymously? *"
                htmlFor="nAnon"
              >
                <div className="flex gap-2">
                  {(["no", "yes"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, anonymous: v }))}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                        state.anonymous === v
                          ? "border-gold/60 bg-gold/10 text-white"
                          : "border-white/10 bg-white/[0.025] text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {v === "yes" ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </Section>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <label className="flex items-start gap-3 text-sm text-white/75">
          <input
            type="checkbox"
            checked={state.agreedToTerms}
            onChange={(e) => setBool("agreedToTerms", e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-[#D4AF37]"
          />
          <span>
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold underline-offset-4 hover:underline"
            >
              Nomination Terms and Conditions
            </a>
            .
          </span>
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-4 text-sm font-semibold text-ink shadow-gold transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {submitting
            ? isEdit
              ? "Saving…"
              : "Submitting…"
            : isEdit
              ? "Save Changes"
              : "Submit Nomination"}
          {!submitting && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-white/45">
          <ShieldCheck className="h-3.5 w-3.5 text-gold/70" />
          Your details are kept confidential and only used for this nomination.
        </p>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Build the JSON payload that gets POSTed to NOMINATION_API_URL          */
/*                                                                          */
/*  Shape (all keys present, optional values may be empty string / null):  */
/*  {                                                                       */
/*    site, submittedAt,                                                    */
/*    awardCategories: string[],                                            */
/*    selfNominate: boolean,                                                */
/*    nominee:   { firstName, lastName, email, mobile, workPhone,           */
/*                 organisation, postCode, anonymous,                       */
/*                 openingStatement, linkedIn, howHeard } | null,           */
/*    nominator: { firstName, lastName, email, mobile, workPhone,           */
/*                 businessName, businessLocation, businessCategory },      */
/*    supporting: { documents: [{name,size,type}], videos: [{name,size,    */
/*                 type}], videoLink: string },                             */
/*    agreedToTerms: boolean                                                */
/*  }                                                                       */
/*                                                                          */
/*  Note: file payloads are NOT bytes. To upload real files use a separate  */
/*  multipart endpoint (or signed URLs) — this JSON tells the backend which */
/*  files the user picked. See README/COMMIT for the full param table.     */
/* ──────────────────────────────────────────────────────────────────────── */

function fileMeta(f: File) {
  return { name: f.name, size: f.size, type: f.type };
}

function buildNominationPayload(
  s: FormState,
  docs: File[],
  videos: File[],
  photo?: { name: string; type: string; url: string },
  siteName?: string,
) {
  // When self-nominating, the nominee IS the nominator — identity fields
  // (name/email/mobile/work phone/organisation) come from "Your Information".
  // The nomination-detail fields (post code, anonymous, opening statement,
  // LinkedIn, how heard) are always collected directly on the form.
  const nominee = s.selfNominate
    ? {
        firstName: s.yourFirstName,
        lastName: s.yourLastName,
        email: s.yourEmail,
        mobile: s.yourMobile,
        workPhone: s.yourWorkPhone,
        organisation: s.yourBusinessName,
        postCode: s.nomineePostCode,
        anonymous: s.anonymous === "yes",
        openingStatement: s.openingStatement,
        linkedIn: s.linkedInProfile,
        howHeard: s.howHeard,
        photo,
      }
    : {
        firstName: s.nomineeFirstName,
        lastName: s.nomineeLastName,
        email: s.nomineeEmail,
        mobile: s.nomineeMobile,
        workPhone: s.nomineeWorkPhone,
        organisation: s.nomineeOrganisation,
        postCode: s.nomineePostCode,
        anonymous: s.anonymous === "yes",
        openingStatement: s.openingStatement,
        linkedIn: s.linkedInProfile,
        howHeard: s.howHeard,
        photo,
      };

  return {
    // The site this nomination actually came from — NOT a build-time constant,
    // or every tenant's submissions get filed under one brand.
    site: siteName ?? "",
    submittedAt: new Date().toISOString(),
    awardCategories: s.awardCategories,
    selfNominate: s.selfNominate,
    nominee,
    nominator: {
      firstName: s.yourFirstName,
      lastName: s.yourLastName,
      email: s.yourEmail,
      mobile: s.yourMobile,
      workPhone: s.yourWorkPhone,
      businessName: s.yourBusinessName,
      businessLocation: s.yourBusinessLocation,
      businessCategory: s.yourBusinessCategory,
    },
    supporting: {
      documents: docs.map(fileMeta),
      videos: videos.map(fileMeta),
      videoLink: s.videoLink,
    },
    agreedToTerms: s.agreedToTerms,
  };
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Layout building blocks                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

function Section({
  n,
  title,
  subtitle,
  right,
  required,
  children,
}: {
  n: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl glass p-6 sm:p-8">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient text-xs font-semibold text-ink shadow-gold-sm">
              {n}
            </span>
            <h2 className="font-display text-lg font-semibold leading-tight text-white sm:text-xl">
              {title}
              {required && <span className="ml-1 text-gold">*</span>}
            </h2>
          </div>
          {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/55">
        {Icon && <Icon className="h-3 w-3 text-gold" />}
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`${inputBase} appearance-none pr-10`}
      >
        <option value="" disabled className="bg-ink text-white/50">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink text-white">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Award category picker — searchable typeahead with selected chips        */
/* ──────────────────────────────────────────────────────────────────────── */

function AwardCategoryPicker({
  selected,
  onToggle,
  onRemove,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Selected chips — shared between mobile + desktop views */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-white"
            >
              {s}
              <button
                type="button"
                onClick={() => onRemove(s)}
                aria-label={`Remove ${s}`}
                className="rounded-full p-0.5 text-white/55 transition-colors hover:bg-white/10 hover:text-gold"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Mobile + tablet (< lg): inline theme-accordion with always-on
          checkboxes. Avoids the search-first dropdown UX on touch screens
          where typing-to-discover is awkward; the user can see all themes,
          tap one to expand, and toggle categories directly. */}
      <div className="lg:hidden">
        <MobileCategoryPicker selected={selected} onToggle={onToggle} />
      </div>

      {/* Desktop (≥ lg): search-first dropdown picker. Faster for keyboard
          users discovering categories by name across ~190 options. */}
      <div className="hidden lg:block">
        <DesktopCategoryPicker selected={selected} onToggle={onToggle} />
      </div>
    </div>
  );
}

/* ─── Desktop (≥ lg): search-first dropdown picker ─── */

function DesktopCategoryPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      AWARD_CATEGORIES.map((g) => {
        const items = [...g.popular, ...g.prime, ...g.more];
        const filtered = q
          ? items.filter((it) => it.toLowerCase().includes(q))
          : items;
        return { id: g.id, name: g.name, items: filtered };
      }).filter((g) => g.items.length > 0),
    [q],
  );

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search + dropdown */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold">
          <Search className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            selected.length === 0
              ? "Search and add award categories…"
              : "Search to add another category…"
          }
          className={`${inputBase} pl-10`}
        />
      </div>

      {open && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink/95 shadow-glass backdrop-blur-md">
          <div className="max-h-[340px] overflow-y-auto p-2">
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-white/50">
                No matches.
              </p>
            )}
            {groups.map((g) => (
              <div key={g.id} className="mb-1">
                <p className="sticky top-0 z-10 bg-ink/95 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
                  {g.name}
                </p>
                <ul>
                  {g.items.map((it) => {
                    const isOn = selected.includes(it);
                    return (
                      <li key={it}>
                        <button
                          type="button"
                          onClick={() => onToggle(it)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isOn
                              ? "bg-gold/10 text-white"
                              : "text-white/80 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <span className="flex-1">{it}</span>
                          <span
                            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                              isOn
                                ? "border-transparent bg-gold-gradient"
                                : "border-white/30"
                            }`}
                          >
                            {isOn && (
                              <Check
                                className="h-2.5 w-2.5 text-ink"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-xs text-white/55">
            <span>
              {selected.length} selected · {ALL_NAMES.length} total
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-semibold text-gold hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Mobile + tablet (< lg): theme accordion with checkbox rows ─── */

function MobileCategoryPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (name: string) => void;
}) {
  // Local search query. Filters categories across all themes; themes with
  // matches auto-expand so the user sees results without an extra tap.
  const [query, setQuery] = useState("");
  // Tracks which theme accordions are open. Default open: any theme that
  // already has a selection (so the user can immediately see what they've
  // picked). Themes without picks start collapsed for a compact view.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    for (const group of AWARD_CATEGORIES) {
      const items = [...group.popular, ...group.prime, ...group.more];
      if (items.some((it) => selected.includes(it))) seed[group.id] = true;
    }
    return seed;
  });

  const q = query.trim().toLowerCase();

  // Pre-compute groups with filter applied + selected-count per theme.
  // Themes with zero matches are dropped while filtering; themes always
  // show when there is no query.
  const groups = useMemo(
    () =>
      AWARD_CATEGORIES.map((group) => {
        const items = [...group.popular, ...group.prime, ...group.more];
        const filtered = q
          ? items.filter((it) => it.toLowerCase().includes(q))
          : items;
        const selectedCount = items.filter((it) =>
          selected.includes(it),
        ).length;
        return {
          id: group.id,
          name: group.name,
          items: filtered,
          total: items.length,
          selectedCount,
        };
      }).filter((g) => g.items.length > 0),
    [q, selected],
  );

  // When the user is actively searching, force the matched themes open.
  // Restore the user's last manual state when the query clears.
  const isSearching = q.length > 0;

  const toggleTheme = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-3">
      {/* Search input — filters across every theme, auto-expands matches */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputMode="search"
          placeholder="Search categories…"
          className={`${inputBase} pl-10`}
        />
      </div>

      {/* Empty state when search has no matches */}
      {isSearching && groups.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/55">
          No categories match &ldquo;{query}&rdquo;.
        </div>
      )}

      {/* Theme accordion list */}
      <div className="space-y-2">
        {groups.map((group) => {
          const isOpen = isSearching || expanded[group.id] === true;
          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
            >
              <button
                type="button"
                onClick={() => toggleTheme(group.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">
                    Theme
                  </p>
                  <p className="mt-0.5 truncate font-display text-base font-semibold text-white">
                    {group.name}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {group.selectedCount > 0 && (
                    <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gold-gradient px-2 text-[0.7rem] font-semibold text-ink">
                      {group.selectedCount}
                    </span>
                  )}
                  <span className="text-xs text-white/45">
                    {isSearching ? group.items.length : group.total}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/55 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <ul className="border-t border-white/10 px-2 py-2">
                  {group.items.map((it) => {
                    const isOn = selected.includes(it);
                    return (
                      <li key={it}>
                        <button
                          type="button"
                          onClick={() => onToggle(it)}
                          aria-pressed={isOn}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                            isOn
                              ? "bg-gold/10 text-white"
                              : "text-white/80 hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06]"
                          }`}
                        >
                          {/* Checkbox indicator — sized 22px for an Apple-HIG
                              compliant tap target inside the full row. */}
                          <span
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                              isOn
                                ? "border-transparent bg-gold-gradient"
                                : "border-white/30"
                            }`}
                          >
                            {isOn && (
                              <Check
                                className="h-3 w-3 text-ink"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <span className="flex-1 leading-snug">{it}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer count — matches the desktop picker's footer */}
      <p className="px-1 text-xs text-white/45">
        {selected.length} selected · {ALL_NAMES.length} total
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  File field                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function FileField({
  icon: Icon,
  label,
  hint,
  accept,
  files,
  onAdd,
  onRemove,
  multi,
  maxBytes,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  accept: string;
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (i: number) => void;
  multi?: boolean;
  maxBytes?: number;
}) {
  const id = `file-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const [sizeError, setSizeError] = useState("");
  return (
    <div>
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/55">
        <Icon className="h-3 w-3 text-gold" />
        {label}
      </span>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-sm text-white/65 transition-colors hover:border-gold/40 hover:bg-gold/[0.04] hover:text-gold"
      >
        <Upload className="h-4 w-4" />
        <span>{files.length > 0 ? "Replace file" : "Browse files"}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multi}
          onChange={(e) => {
            const list = e.target.files;
            if (list) {
              const picked = Array.from(list);
              const tooBig =
                maxBytes != null ? picked.filter((f) => f.size > maxBytes) : [];
              if (tooBig.length > 0 && maxBytes != null) {
                setSizeError(
                  `“${tooBig[0].name}” is too large. Maximum ${fmtMb(maxBytes)}.`,
                );
              } else {
                setSizeError("");
              }
              const ok =
                maxBytes != null
                  ? picked.filter((f) => f.size <= maxBytes)
                  : picked;
              if (ok.length > 0) onAdd(ok);
            }
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>
      {sizeError ? (
        <p className="mt-1.5 text-[0.65rem] text-red-300">{sizeError}</p>
      ) : (
        hint && <p className="mt-1.5 text-[0.65rem] text-white/40">{hint}</p>
      )}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/75"
            >
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${f.name}`}
                className="rounded p-0.5 text-white/45 transition-colors hover:bg-white/10 hover:text-gold"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Success state                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function EditSuccess({
  id,
  backHref = "/organiser",
  viewHref,
}: {
  id?: number;
  backHref?: string;
  viewHref?: string;
}) {
  const view =
    viewHref ?? (id != null ? `/organiser/nominations/${id}` : undefined);
  return (
    <div className="rounded-3xl glass-gold p-8 text-center sm:p-12">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
        <CheckCircle2 className="h-8 w-8 text-ink" />
      </span>
      <h3 className="mt-6 font-display text-2xl font-semibold text-white sm:text-3xl">
        Nomination updated
      </h3>
      <p className="mx-auto mt-3 max-w-md text-white/70">
        Your changes have been saved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-gold/40"
        >
          Back
        </a>
        {view && (
          <a
            href={view}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-ink shadow-gold"
          >
            View nomination
          </a>
        )}
      </div>
    </div>
  );
}

function Success({
  state,
  onAnother,
}: {
  state: FormState;
  onAnother: () => void;
}) {
  const first =
    (state.selfNominate ? state.yourFirstName : state.nomineeFirstName) ||
    "there";
  return (
    <div className="rounded-3xl glass-gold p-8 text-center sm:p-12">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
        <PartyPopper className="h-8 w-8 text-ink" />
      </span>
      <h3 className="mt-6 font-display text-2xl font-semibold text-white sm:text-3xl">
        Your nomination is in 🎉
      </h3>
      <p className="mx-auto mt-3 max-w-md text-white/70">
        Thank you, {first}. We have received the nomination across{" "}
        <strong className="text-white">{state.awardCategories.length}</strong>{" "}
        {state.awardCategories.length === 1 ? "category" : "categories"} and our
        team will be in touch shortly.
      </p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm text-gold">
        <CheckCircle2 className="h-4 w-4" />
        Free · No payment required · No obligation
      </div>

      {state.awardCategories.length > 0 && (
        <div className="mx-auto mt-6 max-w-md text-left">
          <p className="text-xs font-semibold uppercase tracking-luxe text-gold">
            Categories submitted
          </p>
          <ul className="mt-2 space-y-1">
            {state.awardCategories.map((c) => (
              <li
                key={c}
                className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80"
              >
                <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0 text-gold" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-gold/40"
        >
          <Plus className="h-4 w-4 text-gold" />
          Submit another nomination
        </button>
      </div>
    </div>
  );
}
