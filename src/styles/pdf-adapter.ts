/**
 * PDF Adapter - Converts design tokens to ResolvedStylesheet for PDF generation
 */

import type { ResolvedStylesheet, AdmonitionVariant } from '../types/stylesheet.js';
import { colors, spacing, borders, components } from './tokens.js';

/**
 * Generate a ResolvedStylesheet from design tokens
 */
export function generateStylesheetFromTokens(): ResolvedStylesheet {
  const admonitionVariants: AdmonitionVariant[] = ['warning', 'note', 'info', 'tip', 'danger'];

  return {
    variables: {},

    page: {
      size: components.page.size,
      margins: { ...spacing.page },
    },

    headings: {
      1: {
        fontFamily: components.heading.h1.fontFamily,
        fontSize: components.heading.h1.fontSize,
        color: components.heading.h1.color,
        lineHeight: components.heading.h1.lineHeight,
        marginTop: components.heading.h1.marginTop,
        marginBottom: components.heading.h1.marginBottom,
      },
      2: {
        fontFamily: components.heading.h2.fontFamily,
        fontSize: components.heading.h2.fontSize,
        color: components.heading.h2.color,
        lineHeight: components.heading.h2.lineHeight,
        marginTop: components.heading.h2.marginTop,
        marginBottom: components.heading.h2.marginBottom,
      },
      3: {
        fontFamily: components.heading.h3.fontFamily,
        fontSize: components.heading.h3.fontSize,
        color: components.heading.h3.color,
        lineHeight: components.heading.h3.lineHeight,
        marginTop: components.heading.h3.marginTop,
        marginBottom: components.heading.h3.marginBottom,
      },
      4: {
        fontFamily: components.heading.h4.fontFamily,
        fontSize: components.heading.h4.fontSize,
        color: components.heading.h4.color,
        lineHeight: components.heading.h4.lineHeight,
        marginTop: components.heading.h4.marginTop,
        marginBottom: components.heading.h4.marginBottom,
      },
      5: {
        fontFamily: components.heading.h5.fontFamily,
        fontSize: components.heading.h5.fontSize,
        color: components.heading.h5.color,
        lineHeight: components.heading.h5.lineHeight,
        marginTop: components.heading.h5.marginTop,
        marginBottom: components.heading.h5.marginBottom,
      },
      6: {
        fontFamily: components.heading.h6.fontFamily,
        fontSize: components.heading.h6.fontSize,
        color: components.heading.h6.color,
        lineHeight: components.heading.h6.lineHeight,
        marginTop: components.heading.h6.marginTop,
        marginBottom: components.heading.h6.marginBottom,
      },
    },

    paragraph: {
      fontFamily: components.paragraph.fontFamily,
      fontSize: components.paragraph.fontSize,
      color: components.paragraph.color,
      lineHeight: components.paragraph.lineHeight,
      marginBottom: components.paragraph.marginBottom,
      maxWidth: components.paragraph.maxWidth,
    },

    rule: {
      thickness: components.rule.thickness,
      color: components.rule.color,
      marginTop: components.rule.marginTop,
      marginBottom: components.rule.marginBottom,
    },

    admonitions: admonitionVariants.reduce(
      (acc, variant) => {
        const variantStyles = components.admonition.variants[variant];
        acc[variant] = {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: components.admonition.borderWidth,
          padding: components.admonition.padding,
          titleFontFamily: components.admonition.titleFontFamily,
          titleFontSize: components.admonition.titleFontSize,
          titleColor: variantStyles.titleColor,
          contentFontFamily: components.admonition.contentFontFamily,
          contentFontSize: components.admonition.contentFontSize,
          contentColor: variantStyles.contentColor,
          contentLineHeight: components.admonition.contentLineHeight,
        };
        return acc;
      },
      {} as ResolvedStylesheet['admonitions']
    ),

    fields: {
      base: {
        borderWidth: components.field.base.borderWidth,
        borderColor: components.field.base.borderColor,
        backgroundColor: components.field.base.backgroundColor,
      },
      text: {
        borderWidth: components.field.base.borderWidth,
        borderColor: components.field.base.borderColor,
        backgroundColor: components.field.base.backgroundColor,
        fontSize: components.field.text.fontSize,
        height: components.field.text.height,
        padding: components.field.text.padding,
      },
      textarea: {
        borderWidth: components.field.base.borderWidth,
        borderColor: components.field.base.borderColor,
        backgroundColor: components.field.base.backgroundColor,
        fontSize: components.field.textarea.fontSize,
        padding: components.field.textarea.padding,
        lineHeight: components.field.textarea.lineHeight,
      },
      checkbox: {
        borderWidth: components.field.base.borderWidth,
        borderColor: components.field.base.borderColor,
        backgroundColor: components.field.base.backgroundColor,
        size: components.field.checkbox.size,
      },
      radio: {
        borderWidth: components.field.base.borderWidth,
        borderColor: components.field.base.borderColor,
        backgroundColor: components.field.base.backgroundColor,
        size: components.field.radio.size,
      },
      dropdown: {
        borderWidth: components.field.base.borderWidth,
        borderColor: components.field.base.borderColor,
        backgroundColor: components.field.base.backgroundColor,
        fontSize: components.field.dropdown.fontSize,
        height: components.field.dropdown.height,
        padding: components.field.dropdown.padding,
      },
      signature: {
        borderWidth: borders.width.medium,
        borderColor: components.field.base.borderColor,
        backgroundColor: colors.gray[50],
        fontSize: components.field.signature.fontSize,
        requiredBorderColor: components.field.signature.requiredBorderColor,
        requiredBorderWidth: components.field.signature.requiredBorderWidth,
      },
      label: {
        fontFamily: components.field.label.fontFamily,
        fontSize: components.field.label.fontSize,
        color: components.field.label.color,
        marginBottom: components.field.label.marginBottom,
      },
    },

    header: {
      fontFamily: components.header.fontFamily,
      fontSize: components.header.fontSize,
      color: components.header.color,
    },

    footer: {
      fontFamily: components.footer.fontFamily,
      fontSize: components.footer.fontSize,
      color: components.footer.color,
    },

    table: {
      headerBackgroundColor: components.table.headerBackgroundColor,
      headerTextColor: components.table.headerTextColor,
      headerFontFamily: components.table.headerFontFamily,
      headerFontSize: components.table.headerFontSize,
      rowBackgroundColor: components.table.rowBackgroundColor,
      alternateRowColor: components.table.alternateRowColor,
      borderColor: components.table.borderColor,
      borderWidth: components.table.borderWidth,
      cellPadding: components.table.cellPadding,
      cellFontFamily: components.table.cellFontFamily,
      cellFontSize: components.table.cellFontSize,
      cellTextColor: components.table.cellTextColor,
      rowHeight: components.table.rowHeight,
      headerHeight: components.table.headerHeight,
    },
  };
}
