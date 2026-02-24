import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] })
    .notNull()
    .default("user"),
  passwordChangedAt: text("password_changed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const stories = sqliteTable("stories", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  theme: text("theme").notNull(),
  setting: text("setting").notNull(),
  tone: text("tone").notNull(),
  moral: text("moral").notNull(),
  duration: integer("duration").notNull(), // 5, 10, or 15
  childName: text("child_name").notNull(),
  context: text("context").default(""),
  plan: text("plan"), // JSON string
  status: text("status", {
    enum: [
      "draft",
      "plan_ready",
      "text_ready",
      "characters_ready",
      "images_ready",
      "complete",
    ],
  })
    .notNull()
    .default("draft"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const storyPages = sqliteTable("story_pages", {
  id: text("id").primaryKey(),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  imagePrompt: text("image_prompt"),
  imagePath: text("image_path"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  referenceImagePath: text("reference_image_path"),
  isUploaded: integer("is_uploaded", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
