import { join } from "@std/path";
import { DEFAULT_CONFIG } from "../config.ts";
import { renderNfoDocument } from "../nfo/template.ts";
import { convertToNfo } from "./convertToNfo.ts";

interface FetchOptions {
  outputDir?: string;
  delayMs?: number;
}

export const generateNfoFiles = async (
  host: string,
  targetPath: string,
  cookie?: string,
  options: FetchOptions = {},
) => {
  const finishedNames = [] as string[];

  const targetEntries = Deno.readDirSync(targetPath);

  for (const dirEntry of targetEntries) {
    if (dirEntry.isDirectory) {
      continue;
    }
    const fileName = dirEntry.name;
    const [name, ext] = fileName.split(".");
    if (ext.includes("nfo")) {
      finishedNames.push(name!);
    }
  }

  const outputDir = options.outputDir ?? DEFAULT_CONFIG.outputDir;
  const delayMs = options.delayMs ?? DEFAULT_CONFIG.delayMs;

  const outputEntries = Deno.readDirSync(outputDir);
  for (const dirEntry of outputEntries) {
    const fileName = dirEntry.name;
    const noExtName = fileName.split(".").shift();
    finishedNames.push(noExtName!);
  }

  const errors = [] as string[];
  const remainingEntries = Deno.readDirSync(targetPath);

  for (const dirEntry of remainingEntries) {
    const fileName = dirEntry.name;
    const noExtName = fileName.split(".").shift();
    if (!noExtName) {
      continue;
    }
    const notAFile = dirEntry.isDirectory;
    if (
      finishedNames.includes(noExtName!) || notAFile
    ) {
      continue;
    }

    try {
      const response = await fetch(`${host}?name=${noExtName}`, {
        method: "POST",
        body: JSON.stringify({
          name: noExtName,
          cookie,
        }),
      });

      const resultJson = (await response.json()) as {
        [key: string]: string[] | string;
      };

      const insertTarget = convertToNfo(resultJson);
      const resultNfoContent = renderNfoDocument(insertTarget.split("\n"));

      await Deno.writeTextFile(
        join(outputDir, `${noExtName}.nfo`),
        resultNfoContent,
      );
      console.log(`finished ${fileName} successfully`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err) {
      console.log(err);
      console.log(`${dirEntry.name} in error`);
      errors.push(fileName);
    }
  }
  console.log(`${errors}`);
};
