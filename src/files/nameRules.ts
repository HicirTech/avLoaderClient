/**
 * Pure filename rules. Nothing here touches the disk, which is what makes the
 * riskiest logic in this program testable.
 *
 * Releases arrive named after wherever they came from: `hhd800.com@ABC-123`,
 * `[javdb.com]ABC-123`, or with the domain spaced out to dodge filters as
 * `h h d 8 0 0 . c o m`. The library only wants `ABC-123`.
 */

const SPACED_DOMAIN_CANDIDATE_PATTERN =
  /(?:[a-z0-9]\s+){2,}[a-z0-9]\s*\.\s*(?:[a-z0-9]\s*){2,}/gi;
const DOMAIN_PATTERN = /^(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,24}$/i;
const LEADING_DOMAIN_SOURCE_PATTERN =
  /^(?:\[)?(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:\])?(?:[\s_-]+)?/i;

/** Suffixes marking which cut of a release this is. */
const RELEASE_SUFFIXES = ["-CU", "-UC", "-C", "-U"];

export const compactDomainCandidate = (fragment: string): string =>
  fragment.replace(/\s+/g, "").toLowerCase();

export const isDomain = (text: string): boolean => DOMAIN_PATTERN.test(text);

/** Close up a domain that was spaced out to dodge filters. */
export const normalizeObfuscatedWebsite = (text: string): string =>
  text.replace(SPACED_DOMAIN_CANDIDATE_PATTERN, (fragment) => {
    const compacted = compactDomainCandidate(fragment);
    return isDomain(compacted) ? compacted : fragment;
  });

export const containsObfuscatedWebsite = (text: string): boolean => {
  const candidates = text.match(SPACED_DOMAIN_CANDIDATE_PATTERN);
  return candidates?.some((fragment) => isDomain(compactDomainCandidate(fragment))) ?? false;
};

/** Strip leading domains, however many are stacked up. */
export const stripLeadingWebsiteSource = (text: string): string => {
  let output = text.trim();
  for (;;) {
    const next = output.replace(LEADING_DOMAIN_SOURCE_PATTERN, "");
    if (next === output) return output;
    output = next.trimStart();
  }
};

/** Drop a `source@` or `source]` prefix, keeping the real title. */
export const stripLeadingSourceMarker = (baseName: string): string => {
  const marker = Math.max(baseName.lastIndexOf("@"), baseName.lastIndexOf("]"));
  return marker >= 0 && marker < baseName.length - 1 ? baseName.slice(marker + 1) : baseName;
};

/**
 * Drop the release-cut suffix.
 *
 * Safe here because only one cut of any movie is ever kept, so two files never
 * reduce to the same name. `renameInPlace` refuses to overwrite anyway.
 */
export const stripReleaseSuffix = (baseName: string): string => {
  const upper = baseName.toUpperCase();
  const suffix = RELEASE_SUFFIXES.find((candidate) => upper.endsWith(candidate));
  return suffix ? baseName.slice(0, -suffix.length) : baseName;
};

const RULES = [
  normalizeObfuscatedWebsite,
  stripLeadingWebsiteSource,
  stripLeadingSourceMarker,
  stripReleaseSuffix,
  (name: string) => name.trim(),
] as const;

/** Apply every rule in order. Returns the input unchanged if the rules empty it. */
export const normalizeBaseName = (baseName: string): string => {
  const normalized = RULES.reduce((current, rule) => rule(current), baseName);
  return normalized || baseName;
};
