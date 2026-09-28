import { assertEquals } from "@std/assert";
import { join } from "@std/path";

import { findVideosToProcess } from "./find.ts";

const MB = 1024 * 1024;

const withTree = async (
  files: Record<string, number>,
  run: (dir: string) => Promise<void>,
) => {
  const dir = await Deno.makeTempDir();
  try {
    for (const [path, size] of Object.entries(files)) {
      const full = join(dir, path);
      await Deno.mkdir(join(full, ".."), { recursive: true });
      await Deno.writeFile(full, new Uint8Array(size));
    }
    await run(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
};

const names = (paths: readonly { path: string }[], dir: string) =>
  paths.map((p) => p.path.slice(dir.length + 1).replaceAll("\\", "/")).sort();

Deno.test("findVideosToProcess descends into the folder per torrent", async () => {
  await withTree(
    { "torrent-a/ABC-123.mp4": 2 * MB, "DEF-456.mp4": 2 * MB },
    async (dir) => {
      const { candidates } = await findVideosToProcess(dir, "mp4", { minSizeBytes: 0 });
      assertEquals(names(candidates, dir), ["DEF-456.mp4", "torrent-a/ABC-123.mp4"]);
    },
  );
});

Deno.test("findVideosToProcess separates files too small to be movies", async () => {
  // Advertising clips ride along in torrents and are a fraction of the size.
  await withTree(
    { "torrent-a/manko.fun.mp4": 1 * MB, "torrent-a/ABC-123.mp4": 8 * MB },
    async (dir) => {
      const { candidates, tooSmall } = await findVideosToProcess(dir, "mp4", {
        minSizeBytes: 4 * MB,
      });

      assertEquals(names(candidates, dir), ["torrent-a/ABC-123.mp4"]);
      assertEquals(names(tooSmall, dir), ["torrent-a/manko.fun.mp4"]);
    },
  );
});

Deno.test("findVideosToProcess reports the size so a run can say what it ignored", async () => {
  await withTree({ "ad.mp4": 3 * MB }, async (dir) => {
    const { tooSmall } = await findVideosToProcess(dir, "mp4", { minSizeBytes: 4 * MB });
    assertEquals(tooSmall[0]?.sizeBytes, 3 * MB);
  });
});

Deno.test("findVideosToProcess ignores other extensions and CJK names", async () => {
  await withTree(
    { "ABC-123.mp4": 8 * MB, "notes.txt": 8 * MB, "中文字幕 DEF-456.mp4": 8 * MB },
    async (dir) => {
      const { candidates } = await findVideosToProcess(dir, "mp4", { minSizeBytes: 0 });
      assertEquals(names(candidates, dir), ["ABC-123.mp4"]);
    },
  );
});
