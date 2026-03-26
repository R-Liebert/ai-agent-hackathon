// src/features/job-post-creator/sections.ts
import { TFunction } from "i18next";

// Canonical backend IDs (no spaces)
export const Section = {
  Header: "Header",
  Appetizer: "Appetizer",
  ShortIntroduction: "ShortIntroduction",
  TeamDescription: "TeamDescription",
  JobDescription: "JobDescription",
  Qualifications: "Qualifications",
} as const;

export type SectionId = (typeof Section)[keyof typeof Section];

export const CANONICAL_SECTIONS: readonly SectionId[] = [
  Section.Header,
  Section.Appetizer,
  Section.ShortIntroduction,
  Section.TeamDescription,
  Section.JobDescription,
  Section.Qualifications,
];

// Map canonical IDs to i18n keys for display
const sectionI18nKeys: Record<SectionId, string> = {
  Header: "job-post-creator:preview.sections.header",
  Appetizer: "job-post-creator:preview.sections.appetizer",
  ShortIntroduction: "job-post-creator:preview.sections.shortIntroduction",
  TeamDescription: "job-post-creator:preview.sections.teamDescription",
  JobDescription: "job-post-creator:preview.sections.jobDescription",
  Qualifications: "job-post-creator:preview.sections.qualifications",
};

// Returns the localized, spaced label (e.g., “Short Introduction”)
export const getSectionLabel = (t: TFunction, id: SectionId): string =>
  t(sectionI18nKeys[id]);

const sanitize = (s: string) => s.replace(/[\s_-]/g, "").toLowerCase();

// Normalize any string to a canonical SectionId if possible
export const toCanonicalSection = (raw?: string): SectionId | undefined => {
  if (!raw) return undefined;

  // Exact match ignoring case
  const direct = CANONICAL_SECTIONS.find(
    (s) => s.toLowerCase() === raw.toLowerCase()
  );
  if (direct) return direct;

  // Relaxed matching (ignores spaces, underscores, hyphens)
  const normalized = sanitize(raw);
  return CANONICAL_SECTIONS.find((s) => sanitize(s) === normalized);
};

// Helper to build ContentItems from i18n “temporaryContent”
export const mapI18nContentToContentItems = (
  t: TFunction,
  items: Array<{ header: string; text: string }>
): Array<{ id: SectionId; header: string; text: string }> => {
  return items
    .map(({ header, text }) => {
      const id = toCanonicalSection(header);
      if (!id) {
        console.warn(`[Content] Unknown section header in i18n: ${header}`);
        return undefined;
      }
      return {
        id,
        header: getSectionLabel(t, id), // Always use translated label
        text,
      };
    })
    .filter(Boolean) as Array<{ id: SectionId; header: string; text: string }>;
};
