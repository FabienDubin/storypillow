import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "storypillow.db");
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Run migrations on startup
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL,
      setting TEXT NOT NULL,
      tone TEXT NOT NULL,
      moral TEXT NOT NULL,
      duration INTEGER NOT NULL,
      child_name TEXT NOT NULL,
      context TEXT DEFAULT '',
      plan TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS story_pages (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      page_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      image_prompt TEXT,
      image_path TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_image_path TEXT,
      is_uploaded INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

initializeDatabase();

export { schema };
