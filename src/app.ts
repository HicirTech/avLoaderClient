import { generateNfoFiles } from "./metadata/doFetch.ts";
import { findFilesWithoutChineseByExtension } from "./files/find.ts";
import { moveFilesToDirectory } from "./files/move.ts";
import { loadConfig } from "./config.ts";

export const runPipeline = async () => {
  const config = await loadConfig();

  const mp4List = await findFilesWithoutChineseByExtension(
    config.targetPath,
    config.extension,
  );

  await moveFilesToDirectory(mp4List, config.targetPath);
  await generateNfoFiles(
    config.host,
    config.targetPath,
    config.cookie,
    {
      outputDir: config.outputDir,
      delayMs: config.delayMs,
    },
  );
};
