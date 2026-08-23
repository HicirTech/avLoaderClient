import { extname, join } from "@std/path";

import { DEFAULT_CONFIG } from "../config.ts";
import { renderNfoDocument } from "../nfo/template.ts";
import { convertToNfo } from "./convertToNfo.ts";
import { readMovie } from "./movie.ts";

interface FetchOptions {
  outputDir?: string;
  delayMs?: number;
}

/** The name a lookup is keyed by: the file without its extension. */
const stemOf = (fileName: string): string => {
  const extension = extname(fileName);
  return extension ? fileName.slice(0, -extension.length) : fileName;
};

const stemsIn = (directory: string): Set<string> => {
  const stems = new Set<string>();
  for (const entry of Deno.readDirSync(directory)) {
    if (entry.isDirectory) continue;
    stems.add(stemOf(entry.name));
  }
  return stems;
};

/**
 * Ask the server about one name.
 *
 * The status check is the important line. The server answers failures with
 * `{error, detail}` and a non-2xx status; writing that body to disk would leave
 * a near-empty .nfo behind, and since a present .nfo means "finished", the name
 * would never be retried. A stale cookie at 3am would quietly cost the whole
 * run.
 */
const lookup = async (host: string, name: string, cookie: string) => {
  const response = await fetch(new URL("/lookup", host), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cookie }),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = body as { error?: string; detail?: string } | null;
    throw new Error(
      `${response.status} ${failure?.error ?? "unknown"}: ${failure?.detail ?? "no detail"}`,
    );
  }

  return readMovie(body);
};

export const generateNfoFiles = async (
  host: string,
  targetPath: string,
  cookie?: string,
  options: FetchOptions = {},
) => {
  const outputDir = options.outputDir ?? DEFAULT_CONFIG.outputDir;
  const delayMs = options.delayMs ?? DEFAULT_CONFIG.delayMs;

  // A name counts as done when a .nfo for it exists, either beside the video or
  // in the output directory.
  const finished = stemsIn(outputDir);
  for (const entry of Deno.readDirSync(targetPath)) {
    if (!entry.isDirectory && extname(entry.name).toLowerCase() === ".nfo") {
      finished.add(stemOf(entry.name));
    }
  }

  const failures: string[] = [];

  for (const entry of Deno.readDirSync(targetPath)) {
    if (entry.isDirectory) continue;

    const name = stemOf(entry.name);
    if (!name || finished.has(name)) continue;

    try {
      const movie = await lookup(host, name, cookie ?? "");
      await Deno.writeTextFile(
        join(outputDir, `${name}.nfo`),
        renderNfoDocument(convertToNfo(movie).split("\n")),
      );
      finished.add(name);
      console.log(`${name}: wrote ${name}.nfo`);
    } catch (error) {
      // Left unwritten on purpose, so the next run tries again.
      console.error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      failures.push(name);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (failures.length) {
    console.error(`${failures.length} failed and will be retried next run: ${failures.join(", ")}`);
  }
};
