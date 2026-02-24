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
      password_changed_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      created_by TEXT REFERENCES users(id),
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
      library_character_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS character_library (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_path TEXT,
      source_story_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Migrations for existing databases (wrapped in try-catch for concurrent workers)
  try {
    const storyCols = sqlite.pragma("table_info(stories)") as { name: string }[];
    if (!storyCols.some((c) => c.name === "created_by")) {
      sqlite.exec("ALTER TABLE stories ADD COLUMN created_by TEXT REFERENCES users(id)");
    }
    const userCols = sqlite.pragma("table_info(users)") as { name: string }[];
    if (!userCols.some((c) => c.name === "password_changed_at")) {
      sqlite.exec("ALTER TABLE users ADD COLUMN password_changed_at TEXT NOT NULL DEFAULT ''");
    }
    const charCols = sqlite.pragma("table_info(characters)") as { name: string }[];
    if (!charCols.some((c) => c.name === "library_character_id")) {
      sqlite.exec("ALTER TABLE characters ADD COLUMN library_character_id TEXT");
    }
  } catch {
    // Migrations may fail if another worker already applied them — safe to ignore
  }

  // Seed admin account if no users exist
  const userCount = sqlite
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };
  if (userCount.count === 0) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn(
        "No users in database. Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to seed an admin account."
      );
      return;
    }

    if (adminPassword.length < 8) {
      console.warn(
        "ADMIN_PASSWORD must be at least 8 characters. Skipping admin seed."
      );
      return;
    }

    const now = new Date().toISOString();
    const adminId = crypto.randomUUID();
    const passwordHash = hashPasswordSync(adminPassword);
    sqlite
      .prepare(
        "INSERT INTO users (id, email, name, password_hash, role, password_changed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        adminId,
        adminEmail.toLowerCase().trim(),
        "Admin",
        passwordHash,
        "admin",
        now,
        now,
        now
      );
    console.log(`Admin account seeded for ${adminEmail}`);
  }
}

initializeDatabase();

export { schema };
