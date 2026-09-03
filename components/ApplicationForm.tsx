'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Check, ChevronRight, ChevronLeft, Upload, User, ShieldCheck,
  MessageSquare, Image as ImageIcon, FileText, Camera, Trophy, Eye, Clock,
  AlertCircle, ChevronDown, Pencil,
} from 'lucide-react';
import type { EventQuestion } from '@/app/apply/page';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StaticFormData {
  // Step 1 – Personal
  first_name: string; last_name: string; dob: string; gender: string;
  phone: string; mobile: string; email: string;
  address: string; city: string; county: string; post_code: string;
  profile_picture: File | null; cv: File | null;
  // Step 1 – Work
  industry: string; job_title: string; org_name: string;
  org_phone: string; website: string;
  org_address: string; org_city: string; org_county: string; org_post_code: string;
  company_logo: File | null; company_profile: File | null;
  facebook: string; twitter: string; linkedin: string; instagram: string;
  // Step 4 – Logo
  logo_main: File | null; logo_alt: File | null; brand_colour: string;
  // Step 5 – Documents
  doc1: File | null; doc2: File | null; doc3: File | null;
  // Step 6 – JH Images
  img1: File | null; img2: File | null; img3: File | null; img4: File | null;
  // Step 7 – Trophy
  trophy_name: string; trophy_title: string; trophy_message: string;
}

// Dynamic answers keyed by question id
type DynamicAnswers = Record<number, string>;

const EMPTY: StaticFormData = {
  first_name: '', last_name: '', dob: '', gender: '', phone: '', mobile: '',
  email: '', address: '', city: '', county: '', post_code: '',
  profile_picture: null, cv: null,
  industry: '', job_title: '', org_name: '', org_phone: '', website: '',
  org_address: '', org_city: '', org_county: '', org_post_code: '',
  company_logo: null, company_profile: null,
  facebook: '', twitter: '', linkedin: '', instagram: '',
  logo_main: null, logo_alt: null, brand_colour: '#d4a017',
  doc1: null, doc2: null, doc3: null,
  img1: null, img2: null, img3: null, img4: null,
  trophy_name: '', trophy_title: '', trophy_message: '',
};

const STEPS = [
  { id: 1, label: 'Profile',      icon: User },
  { id: 2, label: 'Eligibility',  icon: ShieldCheck },
  { id: 3, label: 'Response',     icon: MessageSquare },
  { id: 4, label: 'Logo',         icon: ImageIcon },
  { id: 5, label: 'Documents',    icon: FileText },
  { id: 6, label: 'AV Images',    icon: Camera },
  { id: 7, label: 'View Trophy',  icon: Trophy },
  { id: 8, label: 'Preview',      icon: Eye },
];

const INDUSTRIES = [
  'Accounting & Finance', 'Agriculture', 'Arts & Entertainment',
  'Business Services', 'Construction', 'Education', 'Engineering',
  'Healthcare', 'Hospitality & Tourism', 'Information Technology',
  'Legal Services', 'Manufacturing', 'Marketing & Advertising',
  'Media & Communications', 'Non-Profit', 'Real Estate', 'Retail',
  'Science & Research', 'Sports & Recreation', 'Transport & Logistics', 'Other',
];

// ---------------------------------------------------------------------------
// Shared input styles (dark glass)
// ---------------------------------------------------------------------------
const inp =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';
const sel = `${inp} bg-ink/80`;
const ta  = `${inp} resize-none`;

function Field({ label, required, half, children }: {
  label: string; required?: boolean; half?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={half ? 'flex flex-col gap-1.5' : 'flex flex-col gap-1.5 sm:col-span-2 col-span-2'}>
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">
        {label}{required && <span className="ml-1 text-gold">*</span>}
      </span>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 col-span-2 flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-gold/70">{children}</span>
      <div className="flex-1 border-t border-gold/20" />
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-left transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40 flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-white/30'}>{value || placeholder || '— Select —'}</span>
        <ChevronDown className={`h-4 w-4 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                  value === opt
                    ? 'bg-gold/20 text-gold font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileUpload({ label, value, onChange, accept, hint }: {
  label: string; value: File | null; onChange: (f: File | null) => void;
  accept?: string; hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">{label}</span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 hover:border-gold/30 hover:text-gold transition-colors w-fit"
      >
        <Upload className="h-4 w-4" />
        {value ? value.name : 'Browse…'}
      </button>
      {hint && <p className="text-xs text-white/30">{hint}</p>}
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic question renderer
// ---------------------------------------------------------------------------
function DynamicQuestion({
  q, index, answer, onChange,
}: {
  q: EventQuestion; index: number; answer: string; onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
      <p className="text-sm font-medium text-white leading-relaxed">
        <span className="mr-2 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-gradient text-xs font-bold text-ink">
          {index + 1}
        </span>
        {q.question_text}
        {!q.is_required && (
          <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[0.6rem] font-normal text-white/30 uppercase tracking-wide">Optional</span>
        )}
      </p>

      {/* yes_no */}
      {q.field_type === 'yes_no' && (
        <div className="flex gap-6 pl-8">
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
              <input type="radio" name={`q_${q.id}`} value={opt}
                checked={answer === opt} onChange={() => onChange(opt)}
                className="accent-gold h-4 w-4" />
              {opt}
            </label>
          ))}
        </div>
      )}

      {/* select (MCQ) */}
      {q.field_type === 'select' && q.options && q.options.length > 0 && (
        <div className="flex flex-col gap-2 pl-8">
          {q.options.map(opt => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
              <input type="radio" name={`q_${q.id}`} value={opt}
                checked={answer === opt} onChange={() => onChange(opt)}
                className="accent-gold h-4 w-4" />
              {opt}
            </label>
          ))}
        </div>
      )}

      {/* text */}
      {/* number */}
      {q.field_type === 'number' && (
        <input
          type="number"
          className={`${inp} pl-8 w-48`}
          value={answer}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter a number"
        />
      )}

      {/* text, paragraph, and anything else */}
      {writesProse(q) && (
        <textarea
          className={`${ta} pl-8`}
          rows={q.field_type === 'paragraph' ? 8 : 5}
          value={answer}
          onChange={e => onChange(e.target.value)}
          placeholder="Write your response here…"
        />
      )}
    </div>
  );
}

/**
 * Whether this question is answered by typing prose — and so needs a textarea.
 *
 * Written as "everything except the types with a control of their own" rather
 * than as a list of the ones that do. The list was `field_type === 'text'`, and
 * the question library holds eight hundred questions typed `paragraph`: an
 * entrant opening the Response step saw the questions, saw no box to answer
 * them in, and had no way to enter at all. Nothing rendered, so nothing said
 * anything was wrong.
 *
 * A type nobody has thought of yet now gets a box instead of silence. A wrong
 * box is a wrong box; no box is a dead end.
 */
function writesProse(q: EventQuestion): boolean {
  if (q.field_type === 'yes_no' || q.field_type === 'number') return false;
  // A select with nothing to select from is not a select. Those rows exist
  // whenever a question is imported before its options are filled in.
  if (q.field_type === 'select' && q.options && q.options.length > 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------
function StepProfile({ data, set }: { data: StaticFormData; set: (k: keyof StaticFormData, v: unknown) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <SectionTitle>Personal Details</SectionTitle>

      <Field label="First Name" required half>
        <input className={inp} value={data.first_name} onChange={e => set('first_name', e.target.value)} placeholder="e.g. John" />
      </Field>
      <Field label="Last Name" required half>
        <input className={inp} value={data.last_name} onChange={e => set('last_name', e.target.value)} placeholder="e.g. Smith" />
      </Field>

      <Field label="Date of Birth" required half>
        <input type="date" className={inp} value={data.dob} onChange={e => set('dob', e.target.value)} />
      </Field>
      <Field label="Gender" required half>
        <div className="flex flex-wrap gap-5 pt-2">
          {['Male', 'Female', 'Prefer not to say'].map(g => (
            <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-white/70">
              <input type="radio" name="gender" value={g} checked={data.gender === g}
                onChange={() => set('gender', g)} className="accent-gold h-4 w-4" />
              {g}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Phone Number" half>
        <input className={inp} value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 20 …" />
      </Field>
      <Field label="Mobile Number" half>
        <input className={inp} value={data.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+44 7…" />
      </Field>

      <Field label="Email Address" required>
        <input type="email" className={inp} value={data.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field label="Correspondence Address" required>
        <input className={inp} value={data.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
      </Field>

      <Field label="City" half>
        <input className={inp} value={data.city} onChange={e => set('city', e.target.value)} placeholder="London" />
      </Field>
      <Field label="County" half>
        <input className={inp} value={data.county} onChange={e => set('county', e.target.value)} placeholder="Greater London" />
      </Field>
      <Field label="Post Code" required half>
        <input className={inp} value={data.post_code} onChange={e => set('post_code', e.target.value)} placeholder="SW1A 1AA" />
      </Field>

      <div className="sm:col-span-2 col-span-2">
        <FileUpload label="Profile Picture" value={data.profile_picture}
          onChange={f => set('profile_picture', f)} accept="image/*"
          hint="Recommended: 400×400px, JPG or PNG" />
      </div>
      <div className="sm:col-span-2 col-span-2">
        <FileUpload label="Upload Your CV" value={data.cv}
          onChange={f => set('cv', f)} accept=".pdf,.doc,.docx"
          hint="PDF or Word document, max 10MB" />
      </div>

      <SectionTitle>Work Information</SectionTitle>

      <Field label="Industry" required half>
        <CustomSelect
          value={data.industry}
          onChange={v => set('industry', v)}
          options={INDUSTRIES}
          placeholder="— Select industry —"
        />
      </Field>
      <Field label="Job Title" required half>
        <input className={inp} value={data.job_title} onChange={e => set('job_title', e.target.value)} placeholder="e.g. CEO" />
      </Field>

      <Field label="Organisation Name" required>
        <input className={inp} value={data.org_name} onChange={e => set('org_name', e.target.value)} placeholder="Your company or organisation" />
      </Field>

      <Field label="Organisation Phone" half>
        <input className={inp} value={data.org_phone} onChange={e => set('org_phone', e.target.value)} placeholder="+44 20 …" />
      </Field>
      <Field label="Website" half>
        <input type="url" className={inp} value={data.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
      </Field>

      <Field label="Organisation Address" required>
        <input className={inp} value={data.org_address} onChange={e => set('org_address', e.target.value)} placeholder="Street address" />
      </Field>
      <Field label="City" half>
        <input className={inp} value={data.org_city} onChange={e => set('org_city', e.target.value)} placeholder="London" />
      </Field>
      <Field label="County" half>
        <input className={inp} value={data.org_county} onChange={e => set('org_county', e.target.value)} placeholder="Greater London" />
      </Field>
      <Field label="Post Code" required half>
        <input className={inp} value={data.org_post_code} onChange={e => set('org_post_code', e.target.value)} placeholder="SW1A 1AA" />
      </Field>

      <div className="sm:col-span-2 col-span-2">
        <FileUpload label="Company Logo" value={data.company_logo}
          onChange={f => set('company_logo', f)} accept="image/*"
          hint="PNG with transparent background preferred, min 300px wide" />
      </div>
      <div className="sm:col-span-2 col-span-2">
        <FileUpload label="Upload Company Profile" value={data.company_profile}
          onChange={f => set('company_profile', f)} accept=".pdf,.doc,.docx"
          hint="Company brochure or profile document, max 20MB" />
      </div>

      <SectionTitle>Social Media</SectionTitle>

      <Field label="Facebook" half>
        <input className={inp} value={data.facebook} onChange={e => set('facebook', e.target.value)} placeholder="https://facebook.com/…" />
      </Field>
      <Field label="Twitter / X" half>
        <input className={inp} value={data.twitter} onChange={e => set('twitter', e.target.value)} placeholder="https://x.com/…" />
      </Field>
      <Field label="LinkedIn" half>
        <input className={inp} value={data.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="Instagram" half>
        <input className={inp} value={data.instagram} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/…" />
      </Field>
    </div>
  );
}

function StepQuestions({
  questions, answers, setAnswer, emptyIcon: EmptyIcon, emptyLabel,
}: {
  questions: EventQuestion[];
  answers: DynamicAnswers;
  setAnswer: (id: number, v: string) => void;
  emptyIcon: React.ElementType;
  emptyLabel: string;
}) {
  const [current, setCurrent] = useState(0);
  const [showAll, setShowAll]  = useState(false);
  const total = questions.length;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
        <EmptyIcon className="mx-auto h-10 w-10 text-white/15 mb-3" />
        <p className="text-sm text-white/30">{emptyLabel}</p>
        <p className="mt-1 text-xs text-white/20">The organiser can add them from Manage Event → Questions.</p>
      </div>
    );
  }

  const answered = questions.filter(q => (answers[q.id] ?? '').trim() !== '').length;

  return (
    <div className="space-y-5">
      {/* Counter + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!showAll && (
            <span className="text-sm text-white/50">
              Question <span className="font-semibold text-white">{current + 1}/{total}</span>
            </span>
          )}
          <span className="text-xs text-white/30">{answered}/{total} answered</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(s => !s)}
          className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/60 hover:text-white hover:border-white/20 transition-colors"
        >
          {showAll ? 'One at a time' : 'View all questions'}
        </button>
      </div>

      {showAll ? (
        /* All questions stacked */
        <div className="space-y-4">
          {questions.map((q, i) => (
            <DynamicQuestion key={q.id} q={q} index={i}
              answer={answers[q.id] ?? ''} onChange={v => setAnswer(q.id, v)} />
          ))}
        </div>
      ) : (
        /* One at a time */
        <div className="space-y-4">
          <DynamicQuestion
            q={questions[current]}
            index={current}
            answer={answers[questions[current].id] ?? ''}
            onChange={v => setAnswer(questions[current].id, v)}
          />
          {/* Question navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setCurrent(c => c - 1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === current ? 'w-6 bg-gold' : (answers[questions[i].id] ?? '').trim() ? 'w-2 bg-gold/40' : 'w-2 bg-white/15'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={current === total - 1}
              onClick={() => setCurrent(c => c + 1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepEligibility({ questions, answers, setAnswer }: {
  questions: EventQuestion[];
  answers: DynamicAnswers;
  setAnswer: (id: number, v: string) => void;
}) {
  return (
    <StepQuestions
      questions={questions}
      answers={answers}
      setAnswer={setAnswer}
      emptyIcon={ShieldCheck}
      emptyLabel="No eligibility questions have been added for this event yet."
    />
  );
}

function StepResponse({ questions, answers, setAnswer }: {
  questions: EventQuestion[];
  answers: DynamicAnswers;
  setAnswer: (id: number, v: string) => void;
}) {
  return (
    <StepQuestions
      questions={questions}
      answers={answers}
      setAnswer={setAnswer}
      emptyIcon={MessageSquare}
      emptyLabel="No application questions have been added for this event yet."
    />
  );
}

function StepLogo({ data, set }: { data: StaticFormData; set: (k: keyof StaticFormData, v: unknown) => void }) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-white/50 leading-relaxed">
        Upload high-quality versions of your company logo for use in award materials, programmes, and trophy engraving.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Primary Logo</h3>
          <p className="text-xs text-white/40">Main logo on dark background (PNG with transparency preferred)</p>
          <FileUpload label="Upload Primary Logo" value={data.logo_main}
            onChange={f => set('logo_main', f)} accept="image/*" hint="Min 600px wide · PNG or SVG" />
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Alternative Logo</h3>
          <p className="text-xs text-white/40">Light version or stacked variant (optional)</p>
          <FileUpload label="Upload Alternative Logo" value={data.logo_alt}
            onChange={f => set('logo_alt', f)} accept="image/*" hint="Min 600px wide · PNG or SVG" />
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">Brand Colour</span>
        <div className="flex items-center gap-4">
          <input type="color" value={data.brand_colour}
            onChange={e => set('brand_colour', e.target.value)}
            className="h-12 w-20 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1" />
          <span className="text-sm text-white/60">{data.brand_colour}</span>
        </div>
        <p className="text-xs text-white/30">Your primary brand colour — used in award collateral</p>
      </div>
    </div>
  );
}

const DOC_SLOTS: { key: keyof StaticFormData; hint: string }[] = [
  { key: 'doc1', hint: 'Annual report, case study, certificate, or other relevant document (PDF, max 20MB)' },
  { key: 'doc2', hint: 'Additional evidence of your achievement or impact (PDF, max 20MB)' },
  { key: 'doc3', hint: 'Any further reference material (PDF, max 20MB)' },
];

function StepDocuments({ data, set }: { data: StaticFormData; set: (k: keyof StaticFormData, v: unknown) => void }) {
  const [count, setCount] = useState(1);
  const visible = DOC_SLOTS.slice(0, count);

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/50 leading-relaxed">
        Upload supporting documents that evidence your achievements. These will be reviewed by the judging panel.
      </p>

      {visible.map(({ key, hint }, i) => (
        <div key={key} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">
              Supporting Document {i + 1}
            </span>
            {i > 0 && (
              <button
                type="button"
                onClick={() => { set(key, null); setCount(c => c - 1); }}
                className="text-xs text-white/30 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <FileUpload label="" value={data[key] as File | null}
            onChange={f => set(key, f)} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" hint={hint} />
          {data[key] && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2">
              <FileText className="h-4 w-4 text-gold/60" />
              <span className="text-sm text-white/60">{(data[key] as File).name}</span>
            </div>
          )}
        </div>
      ))}

      {count < DOC_SLOTS.length && (
        <button
          type="button"
          onClick={() => setCount(c => c + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/60 hover:border-gold/30 hover:text-gold transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add More
        </button>
      )}
    </div>
  );
}

const IMG_SLOTS: { key: keyof StaticFormData; label: string }[] = [
  { key: 'img1', label: 'Photo 1 — Individual / Team Headshot' },
  { key: 'img2', label: 'Photo 2 — Workplace / Office' },
  { key: 'img3', label: 'Photo 3 — Product / Service Showcase' },
  { key: 'img4', label: 'Photo 4 — Event or Achievement' },
];

function StepAVImages({ data, set }: { data: StaticFormData; set: (k: keyof StaticFormData, v: unknown) => void }) {
  const [count, setCount] = useState(1);
  const visible = IMG_SLOTS.slice(0, count);

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/50 leading-relaxed">
        Upload high-quality images that represent you, your team, or your organisation. These may be used in award programmes and press releases.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {visible.map(({ key, label }, i) => (
          <div key={key} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">{label}</span>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => { set(key, null); setCount(c => c - 1); }}
                  className="text-xs text-white/30 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <FileUpload label="" value={data[key] as File | null}
              onChange={f => set(key, f)} accept="image/*"
              hint="JPG or PNG · Min 1000px · Max 10MB" />
            <div className={`rounded-xl border flex items-center justify-center h-28 transition-colors ${data[key] ? 'border-gold/20 bg-gold/5' : 'border-dashed border-white/10'}`}>
              <Camera className={`h-8 w-8 ${data[key] ? 'text-gold/40' : 'text-white/10'}`} />
            </div>
          </div>
        ))}
      </div>

      {count < IMG_SLOTS.length && (
        <button
          type="button"
          onClick={() => setCount(c => c + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-white/60 hover:border-gold/30 hover:text-gold transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add More
        </button>
      )}
    </div>
  );
}

function StepTrophy({ data, set, siteName }: {
  data: StaticFormData;
  set: (k: keyof StaticFormData, v: unknown) => void;
  siteName: string;
}) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-white/50 leading-relaxed">
        Personalise your trophy inscription. These details will be engraved if you are selected as a winner.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
        {/* Trophy preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex flex-col items-center">
            <div className="w-48 h-64 rounded-t-full bg-gradient-to-b from-gold/40 to-gold/10 border border-gold/30 flex flex-col items-center justify-center gap-3 shadow-gold px-6 text-center">
              <Trophy className="h-10 w-10 text-gold/70" />
              <div className="space-y-1">
                <p className="text-[0.6rem] font-bold text-gold uppercase tracking-widest">{siteName}</p>
                <p className="text-sm font-semibold text-white">{data.trophy_name || 'Your Name'}</p>
                <p className="text-xs text-white/60">{data.trophy_title || 'Your Title'}</p>
                {data.trophy_message && (
                  <p className="text-[10px] text-white/40 leading-tight">{data.trophy_message}</p>
                )}
              </div>
            </div>
            <div className="w-32 h-4 bg-gold/20 rounded-b-sm" />
            <div className="w-20 h-2 bg-gold/10 rounded-b" />
          </div>
          <p className="text-xs text-white/30 text-center">Preview only — for illustration purposes</p>
        </div>
        {/* Fields */}
        <div className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">Name on Trophy <span className="text-gold">*</span></span>
            <input className={inp} value={data.trophy_name}
              onChange={e => set('trophy_name', e.target.value)}
              placeholder="e.g. Sarah Johnson" maxLength={40} />
            <p className="text-xs text-white/30">{data.trophy_name.length}/40 characters</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">Title / Company</span>
            <input className={inp} value={data.trophy_title}
              onChange={e => set('trophy_title', e.target.value)}
              placeholder="e.g. CEO, Acme Ltd" maxLength={50} />
            <p className="text-xs text-white/30">{data.trophy_title.length}/50 characters</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/50">Personal Message</span>
            <textarea className={ta} rows={3} value={data.trophy_message}
              onChange={e => set('trophy_message', e.target.value)}
              placeholder="A short personal message (optional)" maxLength={120} />
            <p className="text-xs text-white/30">{data.trophy_message.length}/120 characters</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPreview({ data, eligAnswers, appAnswers, eligQuestions, appQuestions, goToStep, siteName }: {
  data: StaticFormData;
  eligAnswers: DynamicAnswers;
  appAnswers: DynamicAnswers;
  eligQuestions: EventQuestion[];
  appQuestions: EventQuestion[];
  goToStep: (n: number) => void;
  siteName: string;
}) {
  const Row = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div className="flex gap-3 border-b border-white/5 py-2">
        <span className="w-44 flex-shrink-0 text-xs text-white/35 uppercase tracking-wide">{label}</span>
        <span className="text-sm text-white/75 break-words min-w-0">{value}</span>
      </div>
    ) : null;

  function SectionHeader({ title, step }: { title: string; step: number }) {
    return (
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gold/70">{title}</h3>
        <button
          type="button"
          onClick={() => goToStep(step)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/50 hover:border-gold/30 hover:text-gold transition-colors"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">Review your application before submitting. Click Edit on any section to make changes.</p>

      {/* Personal */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <SectionHeader title="Personal Details" step={1} />
        <Row label="Full Name" value={`${data.first_name} ${data.last_name}`.trim()} />
        <Row label="Date of Birth" value={data.dob} />
        <Row label="Gender" value={data.gender} />
        <Row label="Email" value={data.email} />
        <Row label="Mobile" value={data.mobile} />
        <Row label="Address" value={[data.address, data.city, data.post_code].filter(Boolean).join(', ')} />
      </div>

      {/* Work */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <SectionHeader title="Work Information" step={1} />
        <Row label="Job Title" value={data.job_title} />
        <Row label="Organisation" value={data.org_name} />
        <Row label="Industry" value={data.industry} />
        <Row label="Website" value={data.website} />
        <Row label="Org Address" value={[data.org_address, data.org_city, data.org_post_code].filter(Boolean).join(', ')} />
      </div>

      {/* Eligibility answers */}
      {eligQuestions.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <SectionHeader title="Eligibility" step={2} />
          {eligQuestions.map(q => (
            <Row key={q.id} label={q.question_text.slice(0, 40) + (q.question_text.length > 40 ? '…' : '')}
              value={eligAnswers[q.id] ?? '—'} />
          ))}
        </div>
      )}

      {/* Application answers */}
      {appQuestions.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <SectionHeader title="Application Responses" step={3} />
          {appQuestions.map(q => (
            <Row key={q.id} label={q.question_text.slice(0, 40) + (q.question_text.length > 40 ? '…' : '')}
              value={appAnswers[q.id] ?? '—'} />
          ))}
        </div>
      )}

      {/* Logo */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <SectionHeader title="Logo & Branding" step={4} />
        <Row label="Primary Logo" value={data.logo_main?.name ?? ''} />
        <Row label="Alt Logo" value={data.logo_alt?.name ?? ''} />
        <Row label="Brand Colour" value={data.brand_colour} />
      </div>

      {/* Documents */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <SectionHeader title="Supporting Documents" step={5} />
        <Row label="Document 1" value={data.doc1?.name ?? ''} />
        <Row label="Document 2" value={data.doc2?.name ?? ''} />
        <Row label="Document 3" value={data.doc3?.name ?? ''} />
      </div>

      {/* AV Images */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <SectionHeader title="AV Images" step={6} />
        <Row label="Photo 1" value={data.img1?.name ?? ''} />
        <Row label="Photo 2" value={data.img2?.name ?? ''} />
        <Row label="Photo 3" value={data.img3?.name ?? ''} />
        <Row label="Photo 4" value={data.img4?.name ?? ''} />
      </div>

      {/* Trophy */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
        <SectionHeader title="Trophy Inscription" step={7} />
        <Row label="Name" value={data.trophy_name} />
        <Row label="Title" value={data.trophy_title} />
        <Row label="Message" value={data.trophy_message} />
      </div>

      {/* T&C */}
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5">
        <p className="text-sm text-white/70 leading-relaxed">
          By submitting this application you confirm that all information provided is accurate, complete and truthful.
          You agree to the {siteName}{' '}
          <a href="/terms" className="text-gold underline underline-offset-2">Terms &amp; Conditions</a> and{' '}
          <a href="/privacy" className="text-gold underline underline-offset-2">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export type ApplicationPrefill = Partial<StaticFormData>;

export default function ApplicationForm({
  siteName,
  eventTitle,
  eventId,
  eligibilityQuestions,
  applicationQuestions,
  prefill,
}: {
  siteName: string;
  eventTitle: string;
  eventId: number | null;
  eligibilityQuestions: EventQuestion[];
  applicationQuestions: EventQuestion[];
  prefill?: ApplicationPrefill;
}) {
  const [step, setStep]       = useState(1);
  const [data, setData]       = useState<StaticFormData>({ ...EMPTY, ...prefill });
  const [eligAnswers, setEligAnswers] = useState<DynamicAnswers>({});
  const [appAnswers, setAppAnswers]   = useState<DynamicAnswers>({});
  const [submitted, setSubmitted]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refNumber, setRefNumber]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validationError, setValidationError] = useState('');

  function setField(key: keyof StaticFormData, value: unknown) {
    setData(d => ({ ...d, [key]: value }));
  }
  function setEligAnswer(id: number, v: string) {
    setEligAnswers(a => ({ ...a, [id]: v }));
  }
  function setAppAnswer(id: number, v: string) {
    setAppAnswers(a => ({ ...a, [id]: v }));
  }

  function validateStep(): string {
    if (step === 1) {
      if (!data.first_name.trim()) return 'First Name is required.';
      if (!data.last_name.trim())  return 'Last Name is required.';
      if (!data.email.trim())      return 'Email Address is required.';
      if (!data.job_title.trim())  return 'Job Title is required.';
      if (!data.org_name.trim())   return 'Organisation Name is required.';
    }
    if (step === 2) {
      const missing = eligibilityQuestions.filter(q => q.is_required && !eligAnswers[q.id]);
      if (missing.length) return `Please answer all required questions (${missing.length} remaining).`;
    }
    if (step === 3) {
      const missing = applicationQuestions.filter(q => q.is_required && !appAnswers[q.id]?.trim());
      if (missing.length) return `Please answer all required questions (${missing.length} remaining).`;
    }
    return '';
  }

  function goNext() {
    const err = validateStep();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setValidationError('');
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const progress = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  const stepContent: Record<number, React.ReactNode> = {
    1: <StepProfile data={data} set={setField} />,
    2: <StepEligibility questions={eligibilityQuestions} answers={eligAnswers} setAnswer={setEligAnswer} />,
    3: <StepResponse questions={applicationQuestions} answers={appAnswers} setAnswer={setAppAnswer} />,
    4: <StepLogo data={data} set={setField} />,
    5: <StepDocuments data={data} set={setField} />,
    6: <StepAVImages data={data} set={setField} />,
    7: <StepTrophy data={data} set={setField} siteName={siteName} />,
    8: <StepPreview data={data} eligAnswers={eligAnswers} appAnswers={appAnswers}
          eligQuestions={eligibilityQuestions} appQuestions={applicationQuestions}
          siteName={siteName}
          goToStep={n => { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />,
  };

  if (submitted) {
    return (
      <div className="container-luxe section-pad py-24 flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold-gradient shadow-gold mb-8">
          <Check className="h-12 w-12 text-ink" />
        </div>
        <h2 className="font-display text-4xl font-semibold text-white mb-4">Application Submitted!</h2>
        <p className="max-w-lg text-white/60 text-sm leading-relaxed">
          Thank you for applying to the <strong className="text-white">{eventTitle}</strong>.
          We will be in touch within 5 working days.
        </p>
        <a href="/" className="mt-10 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-3 text-sm font-semibold text-ink shadow-gold hover:-translate-y-0.5 transition-transform">
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="container-luxe section-pad py-10">

      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">{siteName}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{eventTitle}</h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-white/50">
          <Clock className="h-3.5 w-3.5" />
          Approximate time to complete: 30 minutes
        </div>
      </div>

      {/* Linear progress bar */}
      <div className="mb-2 flex items-center justify-between text-xs text-white/40">
        <span>Step {step} of {STEPS.length} — {STEPS[step - 1].label}</span>
        <span>{progress}% complete</span>
      </div>
      <div className="mb-8 h-1.5 w-full rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gold-gradient transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicator */}
      <div className="mb-10 flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done   = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div className={`h-px flex-1 transition-colors duration-300 ${done || active ? 'bg-gold/50' : 'bg-white/10'}`} />
                )}
                <button type="button" onClick={() => done && setStep(s.id)}
                  className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    done    ? 'border-gold bg-gold-gradient text-ink cursor-pointer'
                    : active ? 'border-gold bg-gold/10 text-gold ring-4 ring-gold/20'
                              : 'border-white/15 bg-white/[0.03] text-white/30 cursor-default'
                  }`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 transition-colors duration-300 ${done ? 'bg-gold/50' : 'bg-white/10'}`} />
                )}
              </div>
              <span className={`mt-1.5 hidden text-[0.6rem] font-semibold uppercase tracking-wide sm:block ${
                active ? 'text-gold' : done ? 'text-white/50' : 'text-white/20'
              }`}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step card */}
      <div className="rounded-3xl glass p-7 sm:p-10">
        <h2 className="mb-6 font-display text-xl font-semibold text-white">
          {step === 1 ? 'Personal & Work Details' : STEPS[step - 1].label === 'Preview' ? 'Review Your Application' : STEPS[step - 1].label}
        </h2>

        {validationError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {validationError}
          </div>
        )}

        {stepContent[step]}
      </div>

      {/* Submission confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-[#16161e] border border-white/10 shadow-2xl p-10 flex flex-col items-center text-center gap-5">
            {/* Check circle */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/60 bg-gold/10">
              <Check className="h-9 w-9 text-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-white">Thank you for your application!</h2>
              <p className="text-sm text-white/50">
                Reference Number: <span className="font-semibold text-white">{refNumber}</span>
              </p>
              <p className="text-sm text-white/50">Your application has been submitted.</p>
            </div>

            <div className="w-full border-t border-white/8 pt-5 flex gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setSubmitted(true); }}
                className="flex-1 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-ink shadow-gold hover:-translate-y-0.5 transition-all"
              >
                Close Application
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-3 flex-wrap">
          {step > 1 && (
            <button type="button" onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full glass px-6 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <button type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-2.5 text-sm font-semibold text-white/50 hover:text-white/70 transition-colors">
            Save & Continue Later
          </button>
          <a href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-6 py-2.5 text-sm font-semibold text-white/50 hover:text-white/70 transition-colors">
            Back to Dashboard
          </a>
        </div>

        {step < STEPS.length ? (
          <button type="button" onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-2.5 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5">
            Save &amp; Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setSubmitError('');
              try {
                const eligAnswersPayload: Record<string, string> = {};
                eligibilityQuestions.forEach(q => {
                  if (eligAnswers[q.id]) eligAnswersPayload[q.question_text] = eligAnswers[q.id];
                });
                const appAnswersPayload: Record<string, string> = {};
                applicationQuestions.forEach(q => {
                  if (appAnswers[q.id]) appAnswersPayload[q.question_text] = appAnswers[q.id];
                });
                const res = await fetch('/api/apply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event_id: eventId,
                    first_name: data.first_name, last_name: data.last_name,
                    email: data.email, phone: data.phone, mobile: data.mobile,
                    dob: data.dob, gender: data.gender,
                    address: data.address, city: data.city, county: data.county, post_code: data.post_code,
                    job_title: data.job_title, org_name: data.org_name, industry: data.industry,
                    org_phone: data.org_phone, website: data.website,
                    org_address: data.org_address, org_city: data.org_city,
                    org_county: data.org_county, org_post_code: data.org_post_code,
                    facebook: data.facebook, twitter: data.twitter,
                    linkedin: data.linkedin, instagram: data.instagram,
                    brand_colour: data.brand_colour,
                    trophy_name: data.trophy_name, trophy_title: data.trophy_title,
                    trophy_message: data.trophy_message,
                    eligibility_answers: eligAnswersPayload,
                    application_answers: appAnswersPayload,
                  }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? 'Submission failed');
                setRefNumber(json.ref_number);
                setShowConfirm(true);
              } catch (err) {
                setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
              } finally {
                setSubmitting(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-2.5 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" /> Submitting…</> : <>Submit Application <Check className="h-4 w-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}
