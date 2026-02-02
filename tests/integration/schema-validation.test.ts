/**
 * Dynamic Schema Validation Tests
 * Auto-discovers all YAML schemas in schemas/ and runs generic validation tests
 *
 * Adding a new schema file to schemas/ automatically includes it in testing.
 * No code changes required when schemas are added or removed.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { discoverSchemas, type DiscoveredSchema } from '../helpers/schema-discovery.js';
import { parseSchema } from '../../src/parsers/schema.js';
import { generatePdf, type GeneratedPdf } from '../../src/generators/pdf/index.js';
import { getFormFields, isFieldFillable } from '../helpers/acroform-inspector.js';
import {
  fieldsToLayoutElements,
  checkBoundaries,
  detectOverlaps,
} from '../helpers/layout-analyzer.js';

// Discover schemas at module load time
const discoveredSchemas = discoverSchemas();

// Standard page dimensions
const PAGE_SIZE = { width: 612, height: 792 }; // Letter
const DEFAULT_MARGINS = { top: 72, bottom: 70, left: 71, right: 71 };

// Performance thresholds
const MAX_GENERATION_TIME_MS = 10000;
const MIN_FILE_SIZE_KB = 1;
const MAX_FILE_SIZE_KB = 1024;

// Quality thresholds
const MAX_BOUNDARY_VIOLATION_PERCENT = 0.05; // 5% tolerance
const MAX_OVERLAP_PERCENT = 0.5; // 50% overlap threshold for "severe"

describe.skipIf(discoveredSchemas.length === 0)('Dynamic Schema Validation', () => {
  describe.each(discoveredSchemas.map((s) => [s.filename, s] as const))(
    'Schema: %s',
    (_, schemaInfo: DiscoveredSchema) => {
      let schema: Awaited<ReturnType<typeof parseSchema>>;
      let pdf: GeneratedPdf;
      let generationTimeMs: number;

      beforeAll(async () => {
        schema = await parseSchema(schemaInfo.filepath);
        const start = Date.now();
        pdf = await generatePdf({ schema });
        generationTimeMs = Date.now() - start;
      });

      describe('Schema Parsing', () => {
        it('parses without errors', () => {
          expect(schema).toBeDefined();
        });

        it('has valid form metadata', () => {
          expect(schema.form).toBeDefined();
          expect(schema.form.id).toBeDefined();
          expect(typeof schema.form.id).toBe('string');
          expect(schema.form.title).toBeDefined();
          expect(typeof schema.form.title).toBe('string');
        });

        it('has valid fields array', () => {
          expect(schema.fields).toBeDefined();
          expect(Array.isArray(schema.fields)).toBe(true);
        });

        it('has valid content array (if present)', () => {
          if (schema.content) {
            expect(Array.isArray(schema.content)).toBe(true);
            expect(schema.content.length).toBeGreaterThanOrEqual(0);
          }
        });
      });

      describe('PDF Generation', () => {
        it('generates PDF bytes successfully', () => {
          expect(pdf).toBeDefined();
          expect(pdf.bytes).toBeInstanceOf(Uint8Array);
          expect(pdf.bytes.length).toBeGreaterThan(0);
        });

        it('generates at least one page', () => {
          expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
        });

        it('tracks field count', () => {
          expect(typeof pdf.fieldCount).toBe('number');
          expect(pdf.fieldCount).toBeGreaterThanOrEqual(0);
        });
      });

      describe('AcroForm Compliance', () => {
        it('all fields are extractable', async () => {
          const fields = await getFormFields(pdf.bytes);
          // Fields should be an array (may be empty for schemas with embedded table fields)
          expect(Array.isArray(fields)).toBe(true);
        });

        it('text fields are fillable', async () => {
          const fields = await getFormFields(pdf.bytes);
          const textFields = fields.filter((f) => f.type === 'text' || f.type === 'PDFTextField');

          // Test up to 10 text fields for fillability
          for (const textField of textFields.slice(0, 10)) {
            const fillable = await isFieldFillable(pdf.bytes, textField.name);
            expect(fillable).toBe(true);
          }
        });

        it('checkbox fields are fillable', async () => {
          const fields = await getFormFields(pdf.bytes);
          const checkboxes = fields.filter(
            (f) => f.type === 'checkbox' || f.type === 'PDFCheckBox'
          );

          // Test up to 10 checkboxes for fillability
          for (const checkbox of checkboxes.slice(0, 10)) {
            const fillable = await isFieldFillable(pdf.bytes, checkbox.name);
            expect(fillable).toBe(true);
          }
        });

        it('dropdown fields have options', async () => {
          const fields = await getFormFields(pdf.bytes);
          const dropdowns = fields.filter((f) => f.type === 'dropdown' || f.type === 'PDFDropdown');

          for (const dropdown of dropdowns) {
            expect(dropdown.options).toBeDefined();
            expect(dropdown.options!.length).toBeGreaterThanOrEqual(1);
          }
        });

        it('radio groups have multiple options', async () => {
          const fields = await getFormFields(pdf.bytes);
          const radios = fields.filter((f) => f.type === 'radio' || f.type === 'PDFRadioGroup');

          for (const radio of radios) {
            expect(radio.options).toBeDefined();
            expect(radio.options!.length).toBeGreaterThanOrEqual(2);
          }
        });
      });

      describe('Layout Quality', () => {
        it('most fields stay within page boundaries', async () => {
          const fields = await getFormFields(pdf.bytes);

          if (fields.length === 0) {
            // No fields to validate - this is acceptable for schemas using embedded table fields
            return;
          }

          const elements = fieldsToLayoutElements(fields);
          const violations = checkBoundaries(elements, PAGE_SIZE, DEFAULT_MARGINS);

          // Allow up to 5% of fields to have minor boundary issues
          const maxViolations = Math.ceil(fields.length * MAX_BOUNDARY_VIOLATION_PERCENT);
          expect(violations.length).toBeLessThanOrEqual(maxViolations);
        });

        it('no severe field overlaps', async () => {
          const fields = await getFormFields(pdf.bytes);

          if (fields.length === 0) {
            // No fields to check for overlaps
            return;
          }

          const elements = fieldsToLayoutElements(fields);
          const overlaps = detectOverlaps(elements);

          // Filter to severe overlaps (>50% of smaller field area)
          const severeOverlaps = overlaps.filter((o) => o.overlapPercentage > MAX_OVERLAP_PERCENT);

          expect(severeOverlaps.length).toBe(0);
        });
      });

      describe('Performance', () => {
        it(`generates within ${MAX_GENERATION_TIME_MS}ms`, () => {
          expect(generationTimeMs).toBeLessThan(MAX_GENERATION_TIME_MS);
        });

        it(`file size is reasonable (${MIN_FILE_SIZE_KB}KB - ${MAX_FILE_SIZE_KB}KB)`, () => {
          const sizeKB = pdf.bytes.length / 1024;
          expect(sizeKB).toBeGreaterThan(MIN_FILE_SIZE_KB);
          expect(sizeKB).toBeLessThan(MAX_FILE_SIZE_KB);
        });
      });
    }
  );

  it('discovered at least one schema file', () => {
    expect(discoveredSchemas.length).toBeGreaterThan(0);
  });
});
