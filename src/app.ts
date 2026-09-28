import { relative } from "@std/path";

import { loadConfig } from "./config.ts";
import { findVideosToProcess } from "./files/find.ts";
import { collectInto } from "./files/rename.ts";
import { generateNfoFiles } from "./metadata/doFetch.ts";

const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(0)} MB`;

export const runPipeline = async () => {
  const config = await loadConfig();

  const { candidates, tooSmall } = await findVideosToProcess(
    config.targetPath,
    config.extension,
    { minSizeBytes: config.minSizeBytes },
  );

  for (const junk of tooSmall) {
    console.log(`skipped ${relative(config.targetPath, junk.path)} (${mb(junk.sizeBytes)})`);
  }
  console.log(`${candidates.length} ${config.extension} file(s) to process`);

  // Paths are printed relative to the library folder: downloads arrive inside a
  // folder per torrent, so most of these are moves and would read as no-ops if
  // only the file name were shown.
  for (const outcome of await collectInto(candidates.map((c) => c.path), config.targetPath)) {
    const from = relative(config.targetPath, outcome.from);
    if (outcome.renamed) {
      console.log(`moved ${from} -> ${relative(config.targetPath, outcome.to)}`);
    } else if (outcome.skipped !== "already named correctly") {
      console.warn(`left ${from} alone: ${outcome.skipped}`);
    }
  }

  // Rescans the folder rather than taking the paths above: a name that already
  // has a .nfo beside it is finished, however it got there.
  await generateNfoFiles(config.host, config.targetPath, config.cookie, {
    outputDir: config.outputDir,
    delayMs: config.delayMs,
  });
};
