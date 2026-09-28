/**
 * Moving files into the library folder, cleaning up their names on the way.
 *
 * Downloads arrive inside a folder per torrent, so most files really do move;
 * one already sitting in the destination is only renamed. Either way this is
 * the only part of the program that can lose data, so it refuses to overwrite
 * and reports every file individually.
 */

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

const exists = async (path: string): Promise<boolean> => {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
};

/** Clean up a file name, extension preserved. */
export const normalizeFileName = (fileName: string): string => {
  const extension = extname(fileName);
  if (!extension) return normalizeBaseName(fileName);
  return `${normalizeBaseName(fileName.slice(0, -extension.length))}${extension}`;
};

/**
 * Move each file into `directory` under its cleaned-up name.
 *
 * A target that already exists is left alone rather than overwritten. Two
 * torrents can easily carry the same advertising clip, and only one cut of any
 * movie is kept, so a clash means something unexpected -- silently destroying
 * the other file would be the worst answer.
 */
export const collectInto = async (
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

    if (await exists(to)) {
      outcomes.push({ from, to: from, renamed: false, skipped: `${cleaned} already exists` });
      continue;
    }

    try {
      await Deno.rename(from, to);
      outcomes.push({ from, to, renamed: true });
    } catch (error) {
      // One unwritable file must not abandon the rest of the batch.
      outcomes.push({
        from,
        to: from,
        renamed: false,
        skipped: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return outcomes;
};
