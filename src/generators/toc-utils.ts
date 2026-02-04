/**
 * Table of Contents Utilities
 * Shared logic for TOC generation across all output formats (PDF, HTML, DOCX)
 */

import type { TableOfContents, SchemaContentElement } from '../types/schema.js';

/** Resolved TOC configuration with all defaults applied */
export interface ResolvedTocConfig {
  enabled: boolean;
  title: string;
  minLevel: number;
  maxLevel: number;
  numbered: boolean;
  showPageNumbers: boolean;
}

/** A single entry in the Table of Contents */
export interface TocEntry {
  text: string;
  level: number;
  anchorId: string;
  /** Hierarchical numbering string (e.g., "1.2.1") - populated by assignNumbering() */
  numbering?: string;
  /** Page number - populated by PDF/DOCX generators after content rendering */
  pageNumber?: number;
}

/**
 * Resolve TOC configuration by merging user config with defaults.
 * Returns null if TOC is disabled or not configured.
 */
export function resolveTocConfig(toc?: TableOfContents): ResolvedTocConfig | null {
  if (!toc) return null;

  // Check enabled field - the type allows boolean | undefined
  const enabled = toc.enabled;
  if (enabled === false) return null;

  return {
    enabled: toc.enabled !== false,
    title: toc.title ?? 'Table of Contents',
    minLevel: toc.minLevel ?? 1,
    maxLevel: toc.maxLevel ?? 3,
    numbered: toc.numbered ?? false,
    showPageNumbers: toc.showPageNumbers !== false,
  };
}

/**
 * Extract TOC entries from content array by scanning for heading elements
 * within the configured min/max level range.
 */
export function extractTocEntries(
  content: SchemaContentElement[],
  config: ResolvedTocConfig
): TocEntry[] {
  const entries: TocEntry[] = [];

  for (const element of content) {
    if (element.type !== 'heading') continue;
    const heading = element;
    if (heading.level < config.minLevel || heading.level > config.maxLevel) continue;

    entries.push({
      text: heading.text,
      level: heading.level,
      anchorId: generateAnchorId(heading.text),
    });
  }

  return entries;
}

/**
 * Assign hierarchical numbering to TOC entries (e.g., 1, 1.1, 1.1.1).
 * Modifies entries in place and returns them.
 */
export function assignNumbering(entries: TocEntry[]): TocEntry[] {
  if (entries.length === 0) return entries;

  // Find the minimum level to use as the base
  const minLevel = Math.min(...entries.map((e) => e.level));

  // Track counters for each depth level
  const counters: number[] = [0, 0, 0, 0, 0, 0, 0]; // levels 1-6

  for (const entry of entries) {
    const depth = entry.level - minLevel;

    // Increment counter at current depth
    counters[depth]++;

    // Reset all deeper counters
    for (let i = depth + 1; i < counters.length; i++) {
      counters[i] = 0;
    }

    // Build numbering string from level 0 to current depth
    const parts: number[] = [];
    for (let i = 0; i <= depth; i++) {
      parts.push(counters[i]);
    }
    entry.numbering = parts.join('.');
  }

  return entries;
}

/**
 * Generate a URL-safe anchor ID from heading text.
 * Slugifies the text: lowercase, replace spaces/special chars with hyphens.
 */
export function generateAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}
