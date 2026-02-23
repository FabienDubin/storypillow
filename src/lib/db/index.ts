import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Read DATABASE_URL or fall back to default path
const envUrl = process.env.DATABASE_URL;
let dbPath: string;
if (envUrl) {
  // Strip "file:" prefix if present
  dbPath = envUrl.replace(/^file:/, "");
  if (!path.isAbsolute(dbPath)) {
    dbPath = path.resolve(process.cwd(), dbPath);
  }
} else {
  dbPath = path.join(process.cwd(), "data", "storypillow.db");
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Hash password using scrypt (sync, for seeding only)
function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Run migrations on startup
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

  // Seed admin account if no users exist
  const userCount = sqlite
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };
  if (userCount.count === 0) {
    const now = new Date().toISOString();
    const adminId = crypto.randomUUID();
    const passwordHash = hashPasswordSync("admin");
    sqlite
      .prepare(
        "INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        adminId,
        "fabien.dubin@gmail.com",
        "Fabien",
        passwordHash,
        "admin",
        now,
        now
      );
    console.log("Admin account seeded: fabien.dubin@gmail.com / admin");
  }
}

initializeDatabase();

export { schema };
