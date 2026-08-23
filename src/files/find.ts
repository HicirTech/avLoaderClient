import { walk } from "@std/fs";
import { basename } from "@std/path";

/**
 * A name with CJK in it has already been through this program, or is a
 * hand-labelled release worth leaving alone. Either way it is not a candidate.
 */
const hasCjkName = (path: string): boolean => /[㐀-龿]/.test(basename(path));

/** Every file of the given extension that has not been processed yet. */
export const findVideosToProcess = async (
  directory: string,
  extension: string,
): Promise<string[]> => {
  const candidates: string[] = [];

  for await (const entry of walk(directory, { includeDirs: false, exts: [extension] })) {
    if (hasCjkName(entry.path)) continue;
    candidates.push(entry.path);
  }

  return candidates;
};
