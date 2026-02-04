/**
 * Table of Contents Integration Tests
 * Tests TOC generation across PDF, HTML, and DOCX generators
 */

import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { generatePdf } from '../../src/generators/pdf/index.js';
import { generateHtml } from '../../src/generators/html/index.js';
import { generateDocx } from '../../src/generators/docx/index.js';
import type { ParsedFormSchema, HeadingContent, ParagraphContent } from '../../src/types/index.js';

/** Helper: create a schema with TOC and multiple heading levels */
function createTocSchema(tocOptions = {}): ParsedFormSchema {
  return {
    form: {
      id: 'toc-integration-test',
      title: 'TOC Integration Test',
      pages: 1,
      positioning: 'flow',
    },
    tableOfContents: {
      enabled: true,
      ...tocOptions,
    },
    content: [
      { type: 'heading', level: 1, text: 'Introduction' } as HeadingContent,
      { type: 'paragraph', text: 'Intro text.' } as ParagraphContent,
      { type: 'heading', level: 2, text: 'Background' } as HeadingContent,
      { type: 'paragraph', text: 'Background text.' } as ParagraphContent,
      { type: 'heading', level: 2, text: 'Objectives' } as HeadingContent,
      { type: 'paragraph', text: 'Objectives text.' } as ParagraphContent,
      { type: 'heading', level: 3, text: 'Primary Goals' } as HeadingContent,
      { type: 'paragraph', text: 'Goals text.' } as ParagraphContent,
      { type: 'heading', level: 1, text: 'Conclusion' } as HeadingContent,
      { type: 'paragraph', text: 'Conclusion text.' } as ParagraphContent,
    ],
    fields: [],
  };
}

describe('Table of Contents Integration', () => {
  describe('PDF TOC', () => {
    it('inserts TOC page with headings', async () => {
      const schema = createTocSchema();
      const result = await generatePdf({ schema });

      expect(result.bytes).toBeDefined();
      expect(result.bytes.length).toBeGreaterThan(0);

      // TOC should add 1 page (for the small number of headings)
      // Original: 1 content page -> with TOC: 2 pages
      expect(result.pageCount).toBeGreaterThanOrEqual(2);

      const doc = await PDFDocument.load(result.bytes);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
    });

    it('does not insert TOC when disabled', async () => {
      const schema = createTocSchema({ enabled: false });
      const result = await generatePdf({ schema });

      expect(result.pageCount).toBe(1);
    });

    it('does not insert TOC when no headings match level range', async () => {
      const schema: ParsedFormSchema = {
        form: {
          id: 'toc-no-match',
          title: 'No Match',
          pages: 1,
          positioning: 'flow',
        },
        tableOfContents: {
          enabled: true,
          minLevel: 4,
          maxLevel: 6,
        },
        content: [
          { type: 'heading', level: 1, text: 'Only H1' } as HeadingContent,
          { type: 'paragraph', text: 'Text.' } as ParagraphContent,
        ],
        fields: [],
      };

      const result = await generatePdf({ schema });
      expect(result.pageCount).toBe(1); // No TOC page added
    });

    it('works with cover page', async () => {
      const schema: ParsedFormSchema = {
        ...createTocSchema(),
        coverPage: {
          subtitle: 'Test Cover',
        },
      };
      // Cover page adds 1 page, TOC adds 1 page, content is 1 page
      const result = await generatePdf({ schema });
      expect(result.pageCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('HTML TOC', () => {
    it('generates TOC nav element with anchor links', async () => {
      const schema = createTocSchema();
      const html = await generateHtml({ schema });

      expect(html).toContain('table-of-contents');
      expect(html).toContain('toc-link');
      expect(html).toContain('href="#introduction"');
      expect(html).toContain('href="#background"');
      expect(html).toContain('href="#conclusion"');
    });

    it('adds id attributes to headings', async () => {
      const schema = createTocSchema();
      const html = await generateHtml({ schema });

      expect(html).toContain('id="introduction"');
      expect(html).toContain('id="background"');
      expect(html).toContain('id="objectives"');
      expect(html).toContain('id="conclusion"');
    });

    it('includes scroll-spy script', async () => {
      const schema = createTocSchema();
      const html = await generateHtml({ schema });

      expect(html).toContain('IntersectionObserver');
      expect(html).toContain('toc-active');
    });

    it('includes TOC CSS styles', async () => {
      const schema = createTocSchema();
      const html = await generateHtml({ schema });

      expect(html).toContain('.table-of-contents');
      expect(html).toContain('.toc-link');
    });

    it('does not include TOC when disabled', async () => {
      const schema = createTocSchema({ enabled: false });
      const html = await generateHtml({ schema });

      expect(html).not.toContain('table-of-contents');
    });

    it('applies hierarchical numbering when configured', async () => {
      const schema = createTocSchema({ numbered: true });
      const html = await generateHtml({ schema });

      // Should contain numbering like "1 " or "1.1 "
      expect(html).toContain('1 Introduction');
      expect(html).toContain('1.1 Background');
    });

    it('respects maxLevel filter', async () => {
      const schema = createTocSchema({ maxLevel: 1 });
      const html = await generateHtml({ schema });

      // Should only have h1 entries
      expect(html).toContain('href="#introduction"');
      expect(html).toContain('href="#conclusion"');
      expect(html).not.toContain('href="#background"');
      expect(html).not.toContain('href="#primary-goals"');
    });
  });

  describe('DOCX TOC', () => {
    it('generates DOCX with TOC', async () => {
      const schema = createTocSchema();
      const result = await generateDocx({ schema });

      expect(result.bytes).toBeDefined();
      expect(result.bytes.length).toBeGreaterThan(0);
    });

    it('generates DOCX without TOC when disabled', async () => {
      const schema = createTocSchema({ enabled: false });
      const result = await generateDocx({ schema });

      expect(result.bytes).toBeDefined();
      expect(result.bytes.length).toBeGreaterThan(0);
    });
  });

  describe('Schema without TOC config', () => {
    it('PDF generates normally without TOC section', async () => {
      const schema: ParsedFormSchema = {
        form: { id: 'no-toc', title: 'No TOC', pages: 1, positioning: 'flow' },
        content: [{ type: 'heading', level: 1, text: 'Title' } as HeadingContent],
        fields: [],
      };
      const result = await generatePdf({ schema });
      expect(result.pageCount).toBe(1);
    });

    it('HTML generates normally without TOC section', async () => {
      const schema: ParsedFormSchema = {
        form: { id: 'no-toc', title: 'No TOC', pages: 1, positioning: 'flow' },
        content: [{ type: 'heading', level: 1, text: 'Title' } as HeadingContent],
        fields: [],
      };
      const html = await generateHtml({ schema });
      expect(html).not.toContain('table-of-contents');
    });
  });
});
