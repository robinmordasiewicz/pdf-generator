/**
 * DOCX Table of Contents Generator
 * Uses the docx library's native TableOfContents class to generate a Word TOC field.
 * Word will auto-populate page numbers when the user opens and updates the document.
 */

import { TableOfContents, Paragraph, TextRun } from 'docx';
import type { TableOfContents as TocConfig } from '../../types/schema.js';
import { resolveTocConfig } from '../toc-utils.js';
import type { ResolvedStylesheet } from '../../types/stylesheet.js';
import { mapFontFamily, hexToDocxColor, ptToTwip } from './utils.js';

/**
 * Create DOCX Table of Contents elements to be inserted into document children.
 * Returns an array of elements (title paragraph + TOC field), or empty array if disabled.
 */
export function createDocxToc(
  tocConfig: TocConfig | undefined,
  stylesheet: ResolvedStylesheet
): (Paragraph | TableOfContents)[] {
  const config = resolveTocConfig(tocConfig);
  if (!config) return [];

  const elements: (Paragraph | TableOfContents)[] = [];

  // Add TOC title
  const titleStyle = stylesheet.headings[1];
  elements.push(
    new Paragraph({
      spacing: {
        after: ptToTwip(titleStyle.marginBottom),
      },
      children: [
        new TextRun({
          text: config.title,
          font: mapFontFamily(titleStyle.fontFamily),
          size: titleStyle.fontSize * 2, // DOCX uses half-points
          color: hexToDocxColor(titleStyle.color),
          bold: true,
        }),
      ],
    })
  );

  // Create TOC field with heading style range based on minLevel/maxLevel
  const headingRange = `${config.minLevel}-${config.maxLevel}`;
  elements.push(
    new TableOfContents('Table of Contents', {
      hyperlink: true,
      headingStyleRange: headingRange,
      // Show page numbers with dot-leader separator
      entryAndPageNumberSeparator: config.showPageNumbers ? '\t' : undefined,
    })
  );

  // Add page break after TOC
  elements.push(
    new Paragraph({
      pageBreakBefore: true,
      children: [],
    })
  );

  return elements;
}
