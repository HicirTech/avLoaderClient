/**
 * The shape avloaderServer returns.
 *
 * Mirrored here rather than imported: the two run on different runtimes and
 * ship separately, so the wire format is checked at the boundary instead of
 * assumed. `readMovie` is that check.
 */

export interface Movie {
  readonly code: string;
  readonly originalTitle: string;
  readonly translatedTitle: string | null;
  readonly releasedAt: string | null;
  readonly durationMinutes: number | null;
  readonly director: string | null;
  readonly studio: string | null;
  readonly series: string | null;
  readonly rating: number | null;
  readonly voteCount: number | null;
  readonly genres: readonly string[];
  readonly actors: readonly string[];
  readonly previewImages: readonly string[];
  readonly sourceUrl: string;
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

/**
 * Validate a response body into a Movie, or explain why it is not one.
 *
 * The two required fields are the identity. Without them there is nothing worth
 * writing to disk, and writing a near-empty .nfo would mark the file finished
 * for good.
 */
export const readMovie = (body: unknown): Movie => {
  if (typeof body !== "object" || body === null) {
    throw new Error("response body is not a JSON object");
  }

  const raw = body as Record<string, unknown>;
  const code = text(raw.code);
  const originalTitle = text(raw.originalTitle);

  if (!code || !originalTitle) {
    throw new Error("response has no `code` or no `originalTitle`, so it is not a movie");
  }

  return {
    code,
    originalTitle,
    translatedTitle: text(raw.translatedTitle),
    releasedAt: text(raw.releasedAt),
    durationMinutes: number(raw.durationMinutes),
    director: text(raw.director),
    studio: text(raw.studio),
    series: text(raw.series),
    rating: number(raw.rating),
    voteCount: number(raw.voteCount),
    genres: list(raw.genres),
    actors: list(raw.actors),
    previewImages: list(raw.previewImages),
    sourceUrl: text(raw.sourceUrl) ?? "",
  };
};
