import type { Platform } from "../shared/platforms";

export type Role = "admin" | "editor";

export type Account = {
  user: { id: string; email: string; name: string; role: Role };
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  repo_name: string;
  contact_email: string;
  created_at: string;
  niche_count?: number;
  link_count?: number;
};

export type Niche = {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type VideoLink = {
  id: string;
  niche_id: string;
  platform: Platform;
  url: string;
  title: string;
  tag: string;
  position: number;
  created_at: string;
};
