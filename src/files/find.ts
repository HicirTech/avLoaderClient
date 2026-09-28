import { walk } from "@std/fs";
import { basename } from "@std/path";

/**
 * A name with CJK in it has already been through this program, or is a
 * hand-labelled release worth leaving alone. Either way it is not a candidate.
 */
const hasCjkName = (path: string): boolean => /[㐀-龿]/.test(basename(path));

export interface FindOptions {
  /** Files smaller than this are advertising, not movies. */
  readonly minSizeBytes: number;
}

export interface Candidate {
  readonly path: string;
  readonly sizeBytes: number;
}

export interface FindResult {
  readonly candidates: readonly Candidate[];
  /** Files rejected for being too small, so the run can say what it ignored. */
  readonly tooSmall: readonly Candidate[];
}

/**
 * Every file of the given extension worth processing, from this folder and the
 * ones below it -- downloads arrive inside a folder per torrent.
 */
export const findVideosToProcess = async (
  directory: string,
  extension: string,
  { minSizeBytes }: FindOptions,
): Promise<FindResult> => {
  const candidates: Candidate[] = [];
  const tooSmall: Candidate[] = [];

  for await (const entry of walk(directory, { includeDirs: false, exts: [extension] })) {
    if (hasCjkName(entry.path)) continue;

    const { size } = await Deno.stat(entry.path);
    const candidate = { path: entry.path, sizeBytes: size };
    (size < minSizeBytes ? tooSmall : candidates).push(candidate);
  }

  return { candidates, tooSmall };
};
