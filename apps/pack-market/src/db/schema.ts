import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import type { RegistryFile } from "@/lib/registry-types";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  githubId: integer("github_id").unique().notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  createdAt: text("created_at").notNull(),
});

export const packs = sqliteTable("packs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  version: text("version").notNull(),
  description: text("description").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>(),
  files: text("files", { mode: "json" }).notNull().$type<RegistryFile[]>(),
  dependencies: text("dependencies", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>(),
  devDependencies: text("dev_dependencies", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>(),
  registryDeps: text("registry_deps", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  ambrosiaDeps: text("ambrosia_deps", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  publishedBy: text("published_by").notNull(),
  githubId: integer("github_id_publisher").notNull(),
  repoUrl: text("repo_url").notNull().default(""),
  downloads: integer("downloads").notNull().default(0),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  readme: text("readme").notNull().default(""),
});

export const userPacks = sqliteTable(
  "user_packs",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    packId: integer("pack_id")
      .notNull()
      .references(() => packs.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.packId] })]
);
