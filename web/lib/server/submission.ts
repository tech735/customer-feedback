// Checks a feedback submission on the server: the same rules as the form,
// since requests can be sent without it.
import type { NewImage, NewResponse } from "@/lib/server/db";
import {
  CONCERN_AREAS,
  LOCATIONS,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  PHONE_PATTERN,
  PRODUCTS,
  SHARE_TYPES,
  type Campus,
} from "@/lib/form-options";

const MAX_TEXT = 5000;

// Identify images by their first bytes rather than trusting the browser's
// label, since these files are later served back to admins.
function sniffImage(bytes: Buffer): { mimeType: string; extension: string } | null {
  const ascii = (start: number, end: number) => bytes.subarray(start, end).toString("latin1");
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: "image/jpeg", extension: "jpg" };
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return { mimeType: "image/png", extension: "png" };
  if (ascii(0, 4) === "GIF8") return { mimeType: "image/gif", extension: "gif" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mimeType: "image/webp", extension: "webp" };
  if (ascii(4, 8) === "ftyp" && /^(heic|heix|hevc|mif1|msf1)$/.test(ascii(8, 12))) {
    return { mimeType: "image/heic", extension: "heic" };
  }
  return null;
}

type Result = { ok: true; response: NewResponse; images: NewImage[] } | { ok: false; error: string };

export async function parseSubmission(form: FormData): Promise<Result> {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : "";
  };

  const name = text("name");
  const contact = text("contact");
  const campus = text("campus") as Campus;
  const location = text("location");
  const shareType = text("shareType");
  const feedback = text("feedback");

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!PHONE_PATTERN.test(contact)) return { ok: false, error: "Please enter a valid phone number." };
  if (!(campus in LOCATIONS)) return { ok: false, error: "Please choose your campus." };
  if (!LOCATIONS[campus].includes(location)) return { ok: false, error: "Please choose a location." };
  if (!SHARE_TYPES.some((t) => t.value === shareType)) return { ok: false, error: "Please choose what you'd like to share." };
  if (!feedback) return { ok: false, error: "Please write a few words." };

  let products: string[] = [];
  let concernArea = "";
  if (shareType === "Product Enquiry") {
    const allowed = new Set(PRODUCTS[campus].flatMap((g) => g.products.map((p) => p.value)));
    const chosen = [...new Set(form.getAll("products").filter((p): p is string => typeof p === "string"))];
    if (!chosen.length || chosen.some((p) => !allowed.has(p))) return { ok: false, error: "Please select at least one product." };
    const other = text("productOther");
    if (chosen.includes("Other") && !other) return { ok: false, error: "Please tell us which other product." };
    products = chosen.map((p) => (p === "Other" ? `Other: ${other}` : p));
  }
  if (shareType === "Concern about Services") {
    concernArea = text("concernArea");
    if (!(CONCERN_AREAS as readonly string[]).includes(concernArea)) return { ok: false, error: "Please choose what the concern is about." };
  }

  const files = shareType === "Concern about Services" ? [] : form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) return { ok: false, error: `Please upload at most ${MAX_IMAGES} images.` };
  const images: NewImage[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: `${file.name} is larger than 5 MB.` };
    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return { ok: false, error: `${file.name} isn't a supported image (JPG, PNG, WebP, GIF or HEIC).` };
    images.push({ bytes, ...kind, originalName: file.name.slice(0, 200) });
  }

  return { ok: true, response: { name, contact, campus, location, shareType, products, concernArea, feedback }, images };
}
