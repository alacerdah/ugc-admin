// Compartilhado entre o admin e as functions.

export type Platform = "instagram" | "tiktok" | "youtube" | "outro";

export const PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube", "outro"];

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  outro: "Outro",
};

export const isPlatform = (value: unknown): value is Platform => PLATFORMS.includes(value as Platform);
