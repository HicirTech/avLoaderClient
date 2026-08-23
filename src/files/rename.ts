/** Renaming files on disk. */

import { basename, extname, join } from "@std/path";

import { normalizeBaseName } from "./nameRules.ts";

export interface RenameOutcome {
  readonly from: string;
  /** Where it ended up. Equal to `from` when nothing was done. */
  readonly to: string;
  readonly renamed: boolean;
  /** Why it was left alone. Absent when it was renamed. */
  readonly skipped?: string;
}

/** Clean up a file name, extension preserved. */
export const normalizeFileName = (fileName: string): string => {
  const extension = extname(fileName);
  if (!extension) return normalizeBaseName(fileName);
  return `${normalizeBaseName(fileName.slice(0, -extension.length))}${extension}`;
};

/**
 * Rename each file within its own directory.
 *
 * Nothing moves between directories despite how this reads at the call site --
 * the source and the destination have always been the same folder.
 *
 */
export const renameInPlace = async (
  paths: readonly string[],
  directory: string,
): Promise<RenameOutcome[]> => {
  const outcomes: RenameOutcome[] = [];

  for (const from of paths) {
    const cleaned = normalizeFileName(basename(from));
    const to = join(directory, cleaned);

    if (to === from) {
      outcomes.push({ from, to: from, renamed: false, skipped: "already named correctly" });
      continue;
    }

    await Deno.rename(from, to);
    outcomes.push({ from, to, renamed: true });
  }

  return outcomes;
};
