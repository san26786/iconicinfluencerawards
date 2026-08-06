'use client';

// Browser-side image downscaling, run BEFORE an upload leaves the page.
//
// Two problems this solves:
//   1. A serverless function's request body caps at ~4.5MB. Anything larger is
//      rejected by the platform before our route runs, and the rejection has no
//      JSON body — which surfaced to organisers as the opaque
//      "Failed to execute 'json' on 'Response'" error.
//   2. Logo/hero images are stored as base64 data: URLs on the site row, and
//      getSite() runs on every request — so a multi-MB original would be
//      inlined into the HTML of every single page load. Shrinking here keeps
//      pages light.
//
// SVGs are returned untouched: they're vector, already tiny, and rasterising
// them would defeat the point.

export type CompressOptions = {
  /** Longest edge of the output, in pixels. */
  maxDimension: number;
  /** WebP quality, 0–1. */
  quality?: number;
};

export async function compressImage(
  file: File,
  { maxDimension, quality = 0.9 }: CompressOptions,
): Promise<File> {
  if (file.type === 'image/svg+xml') return file;

  const bitmap = await loadBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file; // no 2d context — send the original and let the server decide

  ctx.drawImage(bitmap, 0, 0, outW, outH);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  // WebP keeps alpha (logos need transparency) and compresses far better than PNG.
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  );
  if (!blob) return file;

  // If compression somehow made it bigger (already-optimised small file), keep the original.
  if (blob.size >= file.size && scale === 1) return file;

  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to the <img> path (e.g. Safari with certain formats)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not read that image file.'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * POST a file to one of our upload routes and return the resulting URL.
 * Reads the response defensively: a body-size rejection from the platform comes
 * back with no JSON at all, so parsing blindly throws an error that tells the
 * organiser nothing useful.
 */
export async function postUpload(endpoint: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(endpoint, { method: 'POST', body: fd });
  const text = await res.text();

  let data: { url?: string; error?: string } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON response — handled below */
  }

  if (!data) {
    throw new Error(
      res.status === 413
        ? 'That file is too large to upload. Please use a smaller one.'
        : `Upload failed (${res.status}). Please try a smaller file.`,
    );
  }
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed.');
  return data.url;
}
