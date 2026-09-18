import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // Types entry
  {
    entry: { 'types/index': 'src/types/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
  // Database entry
  {
    entry: { 'database/index': 'src/database/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
  // Events entry
  {
    entry: { 'events/index': 'src/events/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
  // Auth entry
  {
    entry: { 'auth/index': 'src/auth/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
  // Utils entry
  {
    entry: { 'utils/index': 'src/utils/index.ts', 'utils/logger': 'src/utils/logger.ts', 'utils/errors': 'src/utils/errors.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
  // Validation entry
  {
    entry: { 'validation/index': 'src/validation/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
]);