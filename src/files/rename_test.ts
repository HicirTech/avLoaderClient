import { assertEquals } from "@std/assert";
import { join } from "@std/path";

import { normalizeFileName, renameInPlace } from "./rename.ts";

const withTempDir = async (files: string[], run: (dir: string) => Promise<void>) => {
  const dir = await Deno.makeTempDir();
  try {
    for (const name of files) await Deno.writeTextFile(join(dir, name), name);
    await run(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
};

const namesIn = (dir: string) => [...Deno.readDirSync(dir)].map((e) => e.name).sort();

Deno.test("normalizeFileName keeps the extension", () => {
  assertEquals(normalizeFileName("hhd800.com@ABC-123-C.mp4"), "ABC-123.mp4");
  assertEquals(normalizeFileName("ABC-123"), "ABC-123");
});

Deno.test("renameInPlace cleans names without moving between directories", async () => {
  await withTempDir(["[javdb.com]GHI-789.mp4", "hhd800.com@ABC-123-C.mp4"], async (dir) => {
    const outcomes = await renameInPlace(namesIn(dir).map((n) => join(dir, n)), dir);

    assertEquals(namesIn(dir), ["ABC-123.mp4", "GHI-789.mp4"]);
    assertEquals(outcomes.every((o) => o.renamed), true);
  });
});

Deno.test("renameInPlace never overwrites an existing file", async () => {
  // Only one cut of a movie is ever kept, so this should not happen -- but when
  // it did, the other file was destroyed with no message.
  await withTempDir(["ABC-123-C.mp4", "ABC-123.mp4"], async (dir) => {
    const outcomes = await renameInPlace(namesIn(dir).map((n) => join(dir, n)), dir);

    assertEquals(namesIn(dir).length, 2);
    assertEquals(await Deno.readTextFile(join(dir, "ABC-123.mp4")), "ABC-123.mp4");
    assertEquals(outcomes.some((o) => o.skipped?.includes("already exists")), true);
  });
});

Deno.test("renameInPlace keeps a video code containing an at sign", async () => {
  await withTempDir(["DEF-456 @ 4K rip.mp4"], async (dir) => {
    await renameInPlace([join(dir, "DEF-456 @ 4K rip.mp4")], dir);
    assertEquals(namesIn(dir), ["DEF-456 @ 4K rip.mp4"]);
  });
});

Deno.test("renameInPlace reports a file that needed no change", async () => {
  await withTempDir(["ABC-123.mp4"], async (dir) => {
    const [outcome] = await renameInPlace([join(dir, "ABC-123.mp4")], dir);
    assertEquals(outcome?.renamed, false);
    assertEquals(outcome?.skipped, "already named correctly");
  });
});

Deno.test("renameInPlace carries on after a file it cannot touch", async () => {
  await withTempDir(["[javdb.com]GHI-789.mp4"], async (dir) => {
    const outcomes = await renameInPlace(
      [join(dir, "does-not-exist@X-1.mp4"), join(dir, "[javdb.com]GHI-789.mp4")],
      dir,
    );

    assertEquals(outcomes[0]?.renamed, false);
    assertEquals(outcomes[1]?.renamed, true);
    assertEquals(namesIn(dir), ["GHI-789.mp4"]);
  });
});
