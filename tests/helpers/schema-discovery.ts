/**
 * Schema Discovery Helper
 * Auto-discover YAML schema files for dynamic test generation
 */

import { readdirSync } from 'fs';
import { resolve, join, extname, basename } from 'path';

export interface DiscoveredSchema {
  /** Filename including extension (e.g., 'network-ddos.yaml') */
  filename: string;
  /** Full absolute path to schema file */
  filepath: string;
  /** Schema name without extension (e.g., 'network-ddos') */
  name: string;
}

const SCHEMA_DIR = resolve(process.cwd(), 'schemas');

/** Files to exclude from schema discovery */
const EXCLUDED_FILES: string[] = [];

/**
 * Discover all YAML schema files in the schemas directory
 * Excludes JSON files and files in the EXCLUDED_FILES list
 */
export function discoverSchemas(): DiscoveredSchema[] {
  try {
    const files = readdirSync(SCHEMA_DIR);
    return files
      .filter((file) => {
        const ext = extname(file).toLowerCase();
        return (ext === '.yaml' || ext === '.yml') && !EXCLUDED_FILES.includes(file);
      })
      .map((filename) => ({
        filename,
        filepath: join(SCHEMA_DIR, filename),
        name: basename(filename, extname(filename)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    // If schemas directory doesn't exist, return empty array
    return [];
  }
}

/**
 * Get the schemas directory path
 */
export function getSchemasDirectory(): string {
  return SCHEMA_DIR;
}
