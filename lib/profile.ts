// Shared shape for the "My Awards Profile" form. Stored as a single jsonb
// column (users.profile) so we don't have to add ~30 columns. File uploads
// (profile picture, CV, company logo, company profile) are stored in Vercel
// Blob — the json keeps only the public `url`. Older profiles may still hold a
// base64 `dataUrl`; both are read, so existing data keeps working. `email` is
// NOT part of the profile: it's the login identity and lives on the users row.

export type FileRef = {
  name: string;
  type: string;
  url?: string; // Blob URL (new uploads)
  dataUrl?: string; // legacy base64 (existing records)
} | null;

export const PROFILE_TEXT_KEYS = [
  // Personal details
  'firstName', 'lastName', 'dob', 'gender', 'phone', 'mobile',
  'address', 'city', 'county', 'postCode',
  // Work information
  'industry', 'jobTitle', 'orgName', 'orgPhone', 'website',
  'orgAddress', 'orgCity', 'orgPostCode', 'orgCounty',
  // Social media
  'facebook', 'twitter', 'linkedin', 'instagram',
  // Golden words
  'wordsNominated', 'wordsThankYou', 'wordsFinalist', 'wordsWinner',
] as const;

export const PROFILE_FILE_KEYS = [
  'profilePicture', 'cv', 'companyLogo', 'companyProfile',
] as const;

export type ProfileData = Record<(typeof PROFILE_TEXT_KEYS)[number], string> &
  Record<(typeof PROFILE_FILE_KEYS)[number], FileRef>;

export const emptyProfile: ProfileData = {
  ...(Object.fromEntries(PROFILE_TEXT_KEYS.map((k) => [k, ''])) as Record<
    (typeof PROFILE_TEXT_KEYS)[number],
    string
  >),
  ...(Object.fromEntries(PROFILE_FILE_KEYS.map((k) => [k, null])) as Record<
    (typeof PROFILE_FILE_KEYS)[number],
    FileRef
  >),
};

const MAX_TEXT = 8000; // generous for the golden-words textareas
// Cap stored uploads (~3.5MB of base64). The form guards client-side too.
const MAX_FILE_CHARS = 4_800_000;

/** Whitelist + clamp arbitrary input into a safe ProfileData for persistence. */
export function sanitiseProfile(input: unknown): ProfileData {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out: ProfileData = { ...emptyProfile };

  for (const k of PROFILE_TEXT_KEYS) {
    const v = src[k];
    if (typeof v === 'string') out[k] = v.slice(0, MAX_TEXT);
  }

  for (const k of PROFILE_FILE_KEYS) {
    const v = src[k];
    if (v && typeof v === 'object') {
      const f = v as Record<string, unknown>;
      const url = typeof f.url === 'string' ? f.url : '';
      const dataUrl = typeof f.dataUrl === 'string' ? f.dataUrl : '';
      const base = {
        name: typeof f.name === 'string' ? f.name.slice(0, 200) : 'file',
        type: typeof f.type === 'string' ? f.type.slice(0, 120) : '',
      };
      // New uploads: a Vercel Blob URL (restricted to the blob host so the API
      // can't be used to stash arbitrary external links on a profile).
      if (url.startsWith('https://') && url.includes('.blob.vercel-storage.com')) {
        out[k] = { ...base, url };
      } else if (dataUrl.startsWith('data:') && dataUrl.length <= MAX_FILE_CHARS) {
        // Legacy base64 (kept so existing profiles still load + re-save).
        out[k] = { ...base, dataUrl };
      }
    }
  }

  return out;
}

/**
 * Build the form's initial ProfileData from a users row, falling back to the
 * account's name/phone columns when the profile hasn't been filled in yet.
 */
export function profileFromRow(row: {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile: unknown;
}): ProfileData {
  const p: ProfileData = {
    ...emptyProfile,
    ...((row.profile && typeof row.profile === 'object' ? row.profile : {}) as Partial<ProfileData>),
  };
  if (!p.firstName) p.firstName = row.first_name ?? '';
  if (!p.lastName) p.lastName = row.last_name ?? '';
  if (!p.phone) p.phone = row.phone ?? '';
  return p;
}
