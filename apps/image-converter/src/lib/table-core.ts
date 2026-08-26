// Shared primitives for tabular + hierarchical data readers/writers.
// Kept dependency-free so both table-data.ts and structured-data.ts can
// consume them without a cycle.

export const MAX_TABLE_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_DELIMITED_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_TABLE_ROWS = 20_000;
export const MAX_TABLE_COLUMNS = 256;
export const MAX_TABLE_CELLS = 250_000;
export const MAX_TABLE_CELL_CHARS = 32_767;

export function ensureCellBudget(rows: number, columns: number, cells: number): void {
  if (rows > MAX_TABLE_ROWS) throw new Error("table-row-limit");
  if (columns > MAX_TABLE_COLUMNS) throw new Error("table-column-limit");
  if (cells > MAX_TABLE_CELLS) throw new Error("table-cell-limit");
}

export function uniqueHeaders(row: string[]): string[] {
  const used = new Set<string>();
  return row.map((value, index) => {
    const base = value.trim() || `column_${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) { candidate = `${base}_${suffix}`; suffix += 1; }
    used.add(candidate);
    return candidate;
  });
}

export function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
