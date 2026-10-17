// Responses live in a SQLite file and uploaded photos in a folder next to it,
// both under DATA_DIR (default: ./data). Back up that folder to back up
// everything. Uses Node's built-in SQLite (Node 22.13+), so there is nothing
// to compile or install.
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { FeedbackResponse } from "@/lib/types";

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data"));
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function open() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, "feedback.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      campus TEXT NOT NULL,
      location TEXT NOT NULL,
      share_type TEXT NOT NULL,
      products TEXT NOT NULL DEFAULT '[]',
      concern_area TEXT NOT NULL DEFAULT '',
      feedback TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS images_by_response ON images(response_id);
  `);
  return db;
}

// One connection per server process (kept across hot reloads in dev).
const globalForDb = globalThis as unknown as { feedbackDb?: DatabaseSync };
function db() {
  globalForDb.feedbackDb ??= open();
  return globalForDb.feedbackDb;
}

export type NewResponse = Omit<FeedbackResponse, "id" | "timestamp" | "images">;
export type NewImage = { bytes: Buffer; mimeType: string; extension: string; originalName: string };

export function saveResponse(response: NewResponse, images: NewImage[]): number {
  const conn = db(); // Opening the database also creates the uploads folder.
  // Write files first; if the database insert fails, remove them again.
  const stored = images.map((img) => {
    const id = randomUUID();
    const fileName = `${id}.${img.extension}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), img.bytes);
    return { id, fileName, ...img };
  });

  try {
    conn.exec("BEGIN");
    try {
      const { lastInsertRowid } = conn
        .prepare(
          `INSERT INTO responses (created_at, name, contact, campus, location, share_type, products, concern_area, feedback)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          new Date().toISOString(),
          response.name,
          response.contact,
          response.campus,
          response.location,
          response.shareType,
          JSON.stringify(response.products),
          response.concernArea,
          response.feedback,
        );
      const addImage = conn.prepare(
        "INSERT INTO images (id, response_id, file_name, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)",
      );
      for (const img of stored) {
        addImage.run(img.id, lastInsertRowid, img.fileName, img.originalName, img.mimeType, img.bytes.length);
      }
      conn.exec("COMMIT");
      return Number(lastInsertRowid);
    } catch (err) {
      conn.exec("ROLLBACK");
      throw err;
    }
  } catch (err) {
    for (const img of stored) fs.rmSync(path.join(UPLOAD_DIR, img.fileName), { force: true });
    throw err;
  }
}

type ResponseRow = {
  id: number;
  created_at: string;
  name: string;
  contact: string;
  campus: string;
  location: string;
  share_type: string;
  products: string;
  concern_area: string;
  feedback: string;
};
type ImageRow = { id: string; response_id: number; original_name: string };

// Newest first, with when the list was read (date filters count back from it).
export function listResponses(): { responses: FeedbackResponse[]; loadedAt: number } {
  const rows = db().prepare("SELECT * FROM responses ORDER BY created_at DESC, id DESC").all() as unknown as ResponseRow[];
  const images = db().prepare("SELECT id, response_id, original_name FROM images ORDER BY rowid").all() as unknown as ImageRow[];

  const byResponse = new Map<number, FeedbackResponse["images"]>();
  for (const img of images) {
    const list = byResponse.get(img.response_id) ?? [];
    list.push({ id: img.id, url: `/api/admin/images/${img.id}`, name: img.original_name });
    byResponse.set(img.response_id, list);
  }

  const responses = rows.map((r) => ({
    id: r.id,
    timestamp: r.created_at,
    name: r.name,
    contact: r.contact,
    campus: r.campus,
    location: r.location,
    shareType: r.share_type,
    products: JSON.parse(r.products) as string[],
    concernArea: r.concern_area,
    feedback: r.feedback,
    images: byResponse.get(r.id) ?? [],
  }));
  return { responses, loadedAt: Date.now() };
}

export function getImageFile(id: string): { filePath: string; mimeType: string } | null {
  const row = db().prepare("SELECT file_name, mime_type FROM images WHERE id = ?").get(id) as
    | { file_name: string; mime_type: string }
    | undefined; // node:sqlite rows are plain objects
  if (!row) return null;
  return { filePath: path.join(UPLOAD_DIR, row.file_name), mimeType: row.mime_type };
}
