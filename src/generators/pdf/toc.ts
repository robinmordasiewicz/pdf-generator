/**
 * PDF Table of Contents Renderer
 * Generates TOC pages with clickable internal links, dot leaders, and page numbers.
 * Uses a post-render insertion approach: content is rendered first to determine page numbers,
 * then TOC pages are inserted and all page references are adjusted.
 */

import { StandardFonts } from 'pdf-lib';
import type { LayoutContext, DrawnElement } from './layout.js';
import { hexToRgb } from './utils.js';
import {
  resolveTocConfig,
  extractTocEntries,
  assignNumbering,
  type ResolvedTocConfig,
  type TocEntry,
} from '../toc-utils.js';
import type { TableOfContents, SchemaContentElement } from '../../types/schema.js';

/** TOC layout constants */
const TOC_TITLE_FONT_SIZE = 18;
const TOC_ENTRY_FONT_SIZE = 11;
const TOC_ENTRY_LINE_HEIGHT = 20;
const TOC_INDENT_PER_LEVEL = 20;
const TOC_TITLE_MARGIN_BOTTOM = 24;
const DOT_LEADER_CHAR = '.';
const DOT_LEADER_SPACING = 3; // points between dots

/**
 * Generate and insert TOC pages into the PDF document.
 * Must be called AFTER content rendering is complete so page numbers are known.
 *
 * @param ctx - Layout context with rendered content
 * @param tocConfig - Raw TOC configuration from schema
 * @param content - Content array to extract headings from
 * @param hasCoverPage - Whether a cover page exists (affects insertion index)
 * @returns Number of TOC pages inserted (for page number offset adjustment)
 */
export async function insertTocPages(
  ctx: LayoutContext,
  tocConfig: TableOfContents | undefined,
  content: SchemaContentElement[] | undefined,
  hasCoverPage: boolean
): Promise<number> {
  const config = resolveTocConfig(tocConfig);
  if (!config || !content || content.length === 0) return 0;

  const entries = extractTocEntries(content, config);
  if (entries.length === 0) return 0;

  if (config.numbered) {
    assignNumbering(entries);
  }

  // Assign page numbers from drawn elements
  assignPageNumbersFromDrawnElements(entries, ctx.drawnElements, hasCoverPage);

  // Calculate how many TOC pages we need
  const margins = ctx.stylesheet.page.margins;
  const contentHeight =
    ctx.pageSize.height -
    margins.top -
    margins.bottom -
    TOC_TITLE_FONT_SIZE -
    TOC_TITLE_MARGIN_BOTTOM;
  const entriesPerPage = Math.floor(contentHeight / TOC_ENTRY_LINE_HEIGHT);
  const tocPageCount = Math.max(1, Math.ceil(entries.length / entriesPerPage));

  // Determine insertion index (after cover page, or at start)
  const insertIndex = hasCoverPage ? 1 : 0;

  // Insert blank TOC pages
  for (let i = 0; i < tocPageCount; i++) {
    const [pageWidth, pageHeight] = [ctx.pageSize.width, ctx.pageSize.height];
    ctx.doc.insertPage(insertIndex + i, [pageWidth, pageHeight]);
  }

  // Update ctx.pages array to reflect inserted pages
  const insertedPages = [];
  for (let i = 0; i < tocPageCount; i++) {
    insertedPages.push(ctx.doc.getPage(insertIndex + i));
  }
  ctx.pages.splice(insertIndex, 0, ...insertedPages);

  // Render TOC content onto the inserted pages
  await renderTocContent(ctx, config, entries, insertIndex, tocPageCount, entriesPerPage);

  return tocPageCount;
}

/**
 * Assign page numbers to TOC entries by matching heading text against drawn elements.
 * Page numbers from drawnElements are 1-indexed and relative to cover page.
 */
function assignPageNumbersFromDrawnElements(
  entries: TocEntry[],
  drawnElements: DrawnElement[],
  hasCoverPage: boolean
): void {
  // Build a list of heading elements from drawn elements
  const headingElements = drawnElements.filter(
    (el) => el.type === 'heading' || el.type === 'title'
  );

  // For each TOC entry, find matching heading and get page number
  let headingIdx = 0;
  for (const entry of entries) {
    // Search forward from last match position for efficiency
    for (let i = headingIdx; i < headingElements.length; i++) {
      if (headingElements[i].content === entry.text) {
        // drawnElements page is 1-indexed, includes cover page offset
        // For display in TOC, we want content page numbers (excluding cover page)
        entry.pageNumber = hasCoverPage ? headingElements[i].page - 1 : headingElements[i].page;
        headingIdx = i + 1;
        break;
      }
    }
    // Fallback: if no match found, set to 1
    entry.pageNumber ??= 1;
  }
}

/**
 * Render TOC content (title, entries with dot leaders and page numbers) onto pages.
 */
async function renderTocContent(
  ctx: LayoutContext,
  config: ResolvedTocConfig,
  entries: TocEntry[],
  startPageIndex: number,
  tocPageCount: number,
  entriesPerPage: number
): Promise<void> {
  const margins = ctx.stylesheet.page.margins;
  const contentWidth = ctx.pageSize.width - margins.left - margins.right;
  const titleFont = await ctx.doc.embedFont(StandardFonts.HelveticaBold);
  const entryFont = await ctx.doc.embedFont(StandardFonts.Helvetica);
  const titleColor = hexToRgb('#1a1a1a');
  const entryColor = hexToRgb('#333333');
  const pageNumColor = hexToRgb('#555555');
  const dotColor = hexToRgb('#999999');

  for (let pageIdx = 0; pageIdx < tocPageCount; pageIdx++) {
    const page = ctx.pages[startPageIndex + pageIdx];
    let y = ctx.pageSize.height - margins.top;

    // Draw title on first TOC page only
    if (pageIdx === 0) {
      page.drawText(config.title, {
        x: margins.left,
        y,
        size: TOC_TITLE_FONT_SIZE,
        font: titleFont,
        color: titleColor,
      });
      y -= TOC_TITLE_FONT_SIZE + TOC_TITLE_MARGIN_BOTTOM;
    }

    // Draw entries for this page
    const startEntry = pageIdx * entriesPerPage;
    const endEntry = Math.min(startEntry + entriesPerPage, entries.length);

    for (let i = startEntry; i < endEntry; i++) {
      const entry = entries[i];
      const minLevel = Math.min(...entries.map((e) => e.level));
      const indent = (entry.level - minLevel) * TOC_INDENT_PER_LEVEL;
      const x = margins.left + indent;

      // Build entry text (with optional numbering)
      const displayText =
        config.numbered && entry.numbering ? `${entry.numbering}  ${entry.text}` : entry.text;

      const textWidth = entryFont.widthOfTextAtSize(displayText, TOC_ENTRY_FONT_SIZE);

      // Draw entry text
      page.drawText(displayText, {
        x,
        y,
        size: TOC_ENTRY_FONT_SIZE,
        font: entryFont,
        color: entryColor,
      });

      // Draw page number and dot leaders (PDF only)
      if (config.showPageNumbers && entry.pageNumber !== undefined) {
        const pageNumText = String(entry.pageNumber);
        const pageNumWidth = entryFont.widthOfTextAtSize(pageNumText, TOC_ENTRY_FONT_SIZE);
        const pageNumX = margins.left + contentWidth - pageNumWidth;

        // Draw page number right-aligned
        page.drawText(pageNumText, {
          x: pageNumX,
          y,
          size: TOC_ENTRY_FONT_SIZE,
          font: entryFont,
          color: pageNumColor,
        });

        // Draw dot leaders between text and page number
        const dotsStartX = x + textWidth + 8;
        const dotsEndX = pageNumX - 8;
        if (dotsEndX > dotsStartX) {
          const dotWidth = entryFont.widthOfTextAtSize(DOT_LEADER_CHAR, TOC_ENTRY_FONT_SIZE);
          let dotX = dotsStartX;
          while (dotX + dotWidth < dotsEndX) {
            page.drawText(DOT_LEADER_CHAR, {
              x: dotX,
              y,
              size: TOC_ENTRY_FONT_SIZE,
              font: entryFont,
              color: dotColor,
            });
            dotX += dotWidth + DOT_LEADER_SPACING;
          }
        }
      }

      y -= TOC_ENTRY_LINE_HEIGHT;
    }
  }
}

/**
 * Adjust page number references in headers/footers after TOC page insertion.
 * Call this to redraw headers/footers with corrected page numbers.
 */
export function adjustPageNumberOffset(
  tocPageCount: number,
  hasCoverPage: boolean,
  totalPages: number
): { startPage: number; contentPageCount: number } {
  const startPage = hasCoverPage ? 1 + tocPageCount : tocPageCount;
  const contentPageCount = totalPages - startPage;
  return { startPage, contentPageCount };
}
