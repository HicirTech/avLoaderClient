import { walk } from "@std/fs";
import { basename } from "@std/path";
import {
  containsObfuscatedWebsite,
  normalizeObfuscatedWebsite,
} from "./fileNameWebsiteRules.ts";

const hasChineseInFileName = (text: string): boolean => {
  const fileName = basename(text);
  return Boolean(fileName.match(/[\u3400-\u9FBF]/));
};

// Function to find files with a specific extension
export const findFilesWithoutChineseByExtension = async (
  directory: string,
  extension: string,
) => {
  const files: string[] = [];

  for await (
    const entry of walk(directory, { includeDirs: false, exts: [extension] })
  ) {
    const pathName = entry.path;
    const fileName = basename(pathName);
    const pathHasChinese = hasChineseInFileName(pathName);

    if (!pathHasChinese) {
      if (containsObfuscatedWebsite(fileName)) {
        const sanitized = normalizeObfuscatedWebsite(fileName);
        console.log(
          `Will sanitize obfuscated website in filename: ${fileName} -> ${sanitized}`,
        );
      }
      files.push(entry.path);
      continue;
    }

    console.log(`Ignore ${entry.path}`);
  }

  return files;
};
