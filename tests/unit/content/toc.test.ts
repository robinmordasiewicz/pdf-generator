/**
 * Table of Contents Utility Tests
 * Tests the shared TOC logic used by all generators
 */

import { describe, it, expect } from 'vitest';
import {
  resolveTocConfig,
  extractTocEntries,
  assignNumbering,
  generateAnchorId,
} from '../../../src/generators/toc-utils.js';
import type { SchemaContentElement, HeadingContent } from '../../../src/types/index.js';

describe('TOC Utilities', () => {
  describe('resolveTocConfig', () => {
    it('returns null when no config provided', () => {
      expect(resolveTocConfig(undefined)).toBeNull();
    });

    it('returns null when explicitly disabled', () => {
      expect(resolveTocConfig({ enabled: false })).toBeNull();
    });

    it('applies defaults when minimal config provided', () => {
      const result = resolveTocConfig({ enabled: true });
      expect(result).toEqual({
        enabled: true,
        title: 'Table of Contents',
        minLevel: 1,
        maxLevel: 3,
        numbered: false,
        showPageNumbers: true,
      });
    });

    it('applies defaults when empty object provided', () => {
      const result = resolveTocConfig({});
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Table of Contents');
      expect(result!.minLevel).toBe(1);
      expect(result!.maxLevel).toBe(3);
    });

    it('preserves custom values', () => {
      const result = resolveTocConfig({
        title: 'Contents',
        minLevel: 2,
        maxLevel: 4,
        numbered: true,
        showPageNumbers: false,
      });
      expect(result).toEqual({
        enabled: true,
        title: 'Contents',
        minLevel: 2,
        maxLevel: 4,
        numbered: true,
        showPageNumbers: false,
      });
    });
  });

  describe('extractTocEntries', () => {
    const content: SchemaContentElement[] = [
      { type: 'heading', level: 1, text: 'Introduction' } as HeadingContent,
      { type: 'paragraph', text: 'Some text' } as SchemaContentElement,
      { type: 'heading', level: 2, text: 'Background' } as HeadingContent,
      { type: 'heading', level: 3, text: 'Details' } as HeadingContent,
      { type: 'heading', level: 4, text: 'Sub-details' } as HeadingContent,
      { type: 'heading', level: 1, text: 'Conclusion' } as HeadingContent,
      { type: 'rule' } as SchemaContentElement,
    ];

    it('extracts headings within level range', () => {
      const config = resolveTocConfig({ minLevel: 1, maxLevel: 3 })!;
      const entries = extractTocEntries(content, config);
      expect(entries).toHaveLength(4);
      expect(entries[0].text).toBe('Introduction');
      expect(entries[1].text).toBe('Background');
      expect(entries[2].text).toBe('Details');
      expect(entries[3].text).toBe('Conclusion');
    });

    it('filters by minLevel', () => {
      const config = resolveTocConfig({ minLevel: 2, maxLevel: 3 })!;
      const entries = extractTocEntries(content, config);
      expect(entries).toHaveLength(2);
      expect(entries[0].text).toBe('Background');
      expect(entries[1].text).toBe('Details');
    });

    it('filters by maxLevel', () => {
      const config = resolveTocConfig({ minLevel: 1, maxLevel: 1 })!;
      const entries = extractTocEntries(content, config);
      expect(entries).toHaveLength(2);
      expect(entries[0].text).toBe('Introduction');
      expect(entries[1].text).toBe('Conclusion');
    });

    it('returns empty array for empty content', () => {
      const config = resolveTocConfig({})!;
      const entries = extractTocEntries([], config);
      expect(entries).toHaveLength(0);
    });

    it('generates anchor IDs for each entry', () => {
      const config = resolveTocConfig({})!;
      const entries = extractTocEntries(content, config);
      expect(entries[0].anchorId).toBe('introduction');
      expect(entries[1].anchorId).toBe('background');
    });
  });

  describe('assignNumbering', () => {
    it('assigns sequential numbering for flat headings', () => {
      const entries = [
        { text: 'A', level: 1, anchorId: 'a' },
        { text: 'B', level: 1, anchorId: 'b' },
        { text: 'C', level: 1, anchorId: 'c' },
      ];
      assignNumbering(entries);
      expect(entries[0].numbering).toBe('1');
      expect(entries[1].numbering).toBe('2');
      expect(entries[2].numbering).toBe('3');
    });

    it('assigns hierarchical numbering for nested headings', () => {
      const entries = [
        { text: 'Intro', level: 1, anchorId: 'intro' },
        { text: 'BG', level: 2, anchorId: 'bg' },
        { text: 'Obj', level: 2, anchorId: 'obj' },
        { text: 'Goals', level: 3, anchorId: 'goals' },
        { text: 'Main', level: 1, anchorId: 'main' },
        { text: 'Detail', level: 2, anchorId: 'detail' },
      ];
      assignNumbering(entries);
      expect(entries[0].numbering).toBe('1');
      expect(entries[1].numbering).toBe('1.1');
      expect(entries[2].numbering).toBe('1.2');
      expect(entries[3].numbering).toBe('1.2.1');
      expect(entries[4].numbering).toBe('2');
      expect(entries[5].numbering).toBe('2.1');
    });

    it('handles empty entries', () => {
      const entries = assignNumbering([]);
      expect(entries).toHaveLength(0);
    });

    it('resets sub-counters when returning to higher level', () => {
      const entries = [
        { text: 'A', level: 1, anchorId: 'a' },
        { text: 'A1', level: 2, anchorId: 'a1' },
        { text: 'A1a', level: 3, anchorId: 'a1a' },
        { text: 'B', level: 1, anchorId: 'b' },
        { text: 'B1', level: 2, anchorId: 'b1' },
      ];
      assignNumbering(entries);
      expect(entries[4].numbering).toBe('2.1'); // Not 2.2
    });
  });

  describe('generateAnchorId', () => {
    it('converts text to lowercase slug', () => {
      expect(generateAnchorId('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(generateAnchorId('Section 1: Overview!')).toBe('section-1-overview');
    });

    it('collapses multiple spaces/hyphens', () => {
      expect(generateAnchorId('A   B---C')).toBe('a-b-c');
    });

    it('trims leading/trailing hyphens', () => {
      expect(generateAnchorId('  Hello  ')).toBe('hello');
    });

    it('handles mixed case and numbers', () => {
      expect(generateAnchorId('Chapter 3.1 Details')).toBe('chapter-31-details');
    });
  });
});
