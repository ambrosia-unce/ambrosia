import type { PackCategory } from "./registry-types";

/** Extra metadata stored alongside RegistryItem (not sent to CLI). */
export interface PackMeta {
  name: string;
  publishedBy: string;
  githubId: number;
  repoUrl: string;
  publishedAt: string;
  updatedAt: string;
  downloads: number;
  featured: boolean;
}

export interface UserRecord {
  githubId: number;
  username: string;
  avatarUrl: string;
  packs: string[];
  createdAt: string;
}

/** Combined type for UI rendering. */
export interface PackDisplay {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  category: PackCategory;
  publishedBy: string;
  repoUrl: string;
  publishedAt: string;
  updatedAt: string;
  downloads: number;
  featured: boolean;
  installCommand: string;
  readme: string;
}
