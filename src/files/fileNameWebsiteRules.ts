const SPACED_DOMAIN_CANDIDATE_PATTERN =
  /(?:[a-z0-9]\s+){2,}[a-z0-9]\s*\.\s*(?:[a-z0-9]\s*){2,}/gi;
const DOMAIN_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,24}$/i;
const LEADING_DOMAIN_SOURCE_PATTERN =
  /^(?:\[)?(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:\])?(?:[\s_-]+)?/i;

export const compactDomainCandidate = (fragment: string): string => {
  return fragment.replace(/\s+/g, "").toLowerCase();
};

export const isDomain = (text: string): boolean => {
  return DOMAIN_PATTERN.test(text);
};

export const normalizeObfuscatedWebsite = (text: string): string => {
  return text.replace(SPACED_DOMAIN_CANDIDATE_PATTERN, (fragment) => {
    const compacted = compactDomainCandidate(fragment);
    return isDomain(compacted) ? compacted : fragment;
  });
};

export const containsObfuscatedWebsite = (text: string): boolean => {
  const candidates = text.match(SPACED_DOMAIN_CANDIDATE_PATTERN);
  if (!candidates) {
    return false;
  }

  return candidates.some((fragment) =>
    isDomain(compactDomainCandidate(fragment))
  );
};

export const stripLeadingWebsiteSource = (text: string): string => {
  let output = text.trim();

  while (true) {
    const nextOutput = output.replace(LEADING_DOMAIN_SOURCE_PATTERN, "");
    if (nextOutput === output) {
      return output;
    }

    output = nextOutput.trimStart();
  }
};
