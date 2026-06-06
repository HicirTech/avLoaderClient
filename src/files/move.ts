import { basename, extname, join } from "@std/path";
import {
  normalizeObfuscatedWebsite,
  stripLeadingWebsiteSource,
} from "./fileNameWebsiteRules.ts";

type RenameRule = (baseName: string) => string;

const normalizeSpacedWebsite: RenameRule = (baseName) => {
  return normalizeObfuscatedWebsite(baseName);
};

const stripWebsiteSourcePrefix: RenameRule = (baseName) => {
  return stripLeadingWebsiteSource(baseName);
};

const stripDownloadPrefix: RenameRule = (baseName) => {
  const atIndex = baseName.lastIndexOf("@");
  const bracketIndex = baseName.lastIndexOf("]");
  const markerIndex = Math.max(atIndex, bracketIndex);

  // Remove source-like prefix such as "site@" or "xxx]" while keeping the real title.
  if (markerIndex >= 0 && markerIndex < baseName.length - 1) {
    return baseName.slice(markerIndex + 1);
  }

  return baseName;
};

const stripTrailingQualityTag: RenameRule = (baseName) => {
  const upperName = baseName.toUpperCase();
  const qualityTags = ["-CU", "-UC", "-C", "-U"];

  for (const qualityTag of qualityTags) {
    if (upperName.endsWith(qualityTag)) {
      return baseName.slice(0, -qualityTag.length);
    }
  }

  return baseName;
};

const trimFileName: RenameRule = (baseName) => baseName.trim();

const fileRenameRules: RenameRule[] = [
  normalizeSpacedWebsite,
  stripWebsiteSourcePrefix,
  stripDownloadPrefix,
  stripTrailingQualityTag,
  trimFileName,
];

const applyRenameRules = (baseName: string, rules: RenameRule[]): string => {
  return rules.reduce((current, rule) => rule(current), baseName);
};

function normalizeFileName(fileName: string): string {
  const originalFileExtension = extname(fileName);
  if (!originalFileExtension) {
    return fileName;
  }

  const baseName = fileName.slice(0, -originalFileExtension.length);
  const normalizedBaseName = applyRenameRules(baseName, fileRenameRules);

  if (!normalizedBaseName) {
    return fileName;
  }

  return `${normalizedBaseName}${originalFileExtension}`;
}

// Function to find files with a specific extension
export const moveFilesToDirectory = async (fromPaths: string[], to: string) => {
  const newFileLocations: string[] = [];

  for (const fromPath of fromPaths) {
    const fileName = basename(fromPath);
    const cleanedFileName = normalizeFileName(fileName);
    const targetPath = join(to, cleanedFileName);

    await Deno.rename(fromPath, targetPath);
    newFileLocations.push(targetPath);
  }

  return newFileLocations;
};
