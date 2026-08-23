import { basename } from "@std/path";

import { loadConfig } from "./config.ts";
import { findVideosToProcess } from "./files/find.ts";
import { renameInPlace } from "./files/rename.ts";
import { generateNfoFiles } from "./metadata/doFetch.ts";

export const runPipeline = async () => {
  const config = await loadConfig();

  const candidates = await findVideosToProcess(config.targetPath, config.extension);
  console.log(`${candidates.length} ${config.extension} file(s) to process`);

  for (const outcome of await renameInPlace(candidates, config.targetPath)) {
    if (outcome.renamed) {
      console.log(`renamed ${basename(outcome.from)} -> ${basename(outcome.to)}`);
    } else if (outcome.skipped !== "already named correctly") {
      console.warn(`left ${basename(outcome.from)} alone: ${outcome.skipped}`);
    }
  }

  // Rescans the directory rather than taking the paths above: a name that
  // already has a .nfo beside it is finished, however it got there.
  await generateNfoFiles(config.host, config.targetPath, config.cookie, {
    outputDir: config.outputDir,
    delayMs: config.delayMs,
  });
};
