// Block model for the visual email designer. The editor manipulates Block[]
// (persisted to email_templates.design) and renders them to email-safe HTML
// via renderBlocks() — the same function used for the live preview and for the
// `html` that actually gets sent. {{variables}} inside text/labels are left
// intact here; they're substituted per-recipient later (lib/email/template.ts).

export type Block =
  | { id: string; type: 'heading'; text: string; align?: 'left' | 'center' }
  | { id: string; type: 'text'; text: string; align?: 'left' | 'center' }
  | { id: string; type: 'button'; label: string; url: string; align?: 'left' | 'center' }
  | { id: string; type: 'image'; url: string; alt?: string; width?: number }
  | { id: string; type: 'divider' }
  | { id: string; type: 'spacer'; height?: number };

export const BLOCK_TYPES: { type: Block['type']; label: string }[] = [
  { type: 'heading', label: 'Heading' },
  { type: 'text', label: 'Text' },
  { type: 'button', label: 'Button' },
  { type: 'image', label: 'Image' },
  { type: 'divider', label: 'Divider' },
  { type: 'spacer', label: 'Spacer' },
];

export function newBlock(type: Block['type'], id: string): Block {
  switch (type) {
    case 'heading':
      return { id, type, text: 'Your heading', align: 'left' };
    case 'text':
      return { id, type, text: 'Write your message here…', align: 'left' };
    case 'button':
      return { id, type, label: 'Call to action', url: '{{siteUrl}}', align: 'left' };
    case 'image':
      return { id, type, url: '', alt: '', width: 560 };
    case 'spacer':
      return { id, type, height: 24 };
    case 'divider':
      return { id, type };
  }
}

export const defaultBlocks: Block[] = [
  { id: 'b1', type: 'heading', text: 'Hello {{firstName}},', align: 'left' },
  { id: 'b2', type: 'text', text: 'Write your message here…', align: 'left' },
  { id: 'b3', type: 'button', label: 'Call to action', url: '{{siteUrl}}', align: 'left' },
];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Text blocks keep {{vars}} but escape other HTML, and turn newlines into <br>.
const textHtml = (s: string) => esc(s).replace(/\n/g, '<br>');

function blockHtml(b: Block): string {
  switch (b.type) {
    case 'heading':
      return `<h1 style="margin:0 0 14px;font-size:22px;color:#1a1a1a;text-align:${b.align || 'left'}">${textHtml(b.text)}</h1>`;
    case 'text':
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#444;text-align:${b.align || 'left'}">${textHtml(b.text)}</p>`;
    case 'button':
      return `<div style="text-align:${b.align || 'left'};margin:24px 0"><a href="${esc(b.url)}" style="display:inline-block;background:#caa24a;color:#1a1a1a;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 26px;border-radius:999px">${textHtml(b.label)}</a></div>`;
    case 'image':
      return b.url
        ? `<p style="margin:0 0 14px"><img src="${esc(b.url)}" alt="${esc(b.alt || '')}" style="max-width:100%;width:${b.width || 560}px;border-radius:8px" /></p>`
        : '';
    case 'divider':
      return `<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0" />`;
    case 'spacer':
      return `<div style="height:${b.height || 24}px"></div>`;
  }
}

/** Render a block array into a full, branded, email-safe HTML document. */
export function renderBlocks(blocks: Block[]): string {
  const body = blocks.map(blockHtml).join('\n');
  return `<!doctype html><html><body style="margin:0;background:#0b0b12;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
  <div style="text-align:center;padding-bottom:20px"><span style="font-size:20px;font-weight:bold;letter-spacing:2px;color:#caa24a">{{siteName}}</span></div>
  <div style="background:#ffffff;border-radius:16px;padding:32px;color:#1a1a1a">
${body}
  </div>
  <p style="text-align:center;margin:18px 0 0;font-size:11px;color:#777">© {{year}} {{siteName}} · <a href="{{siteUrl}}" style="color:#8a6d1f">{{siteUrl}}</a></p>
</div></body></html>`;
}
