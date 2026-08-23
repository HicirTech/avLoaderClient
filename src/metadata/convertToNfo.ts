/**
 * A Movie, as the NFO body Kodi and Emby read.
 *
 * The server now returns typed English fields, so this is a direct mapping.
 * There is no alias table any more -- the previous one silently dropped rating
 * and director, because the server emitted the traditional labels 評分 and 導演
 * while the table only listed the simplified 评分 and 导演.
 */

import type { Movie } from "./movie.ts";

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const tag = (name: string, value: string | number | null): string[] =>
  value === null || value === "" ? [] : [`<${name}>${escapeXml(String(value))}</${name}>`];

/** Both titles carry the code, which is how the library shows it in a list. */
const titled = (code: string, title: string): string => `[${code}]${title}`;

export const convertToNfo = (movie: Movie): string => {
  const displayTitle = movie.translatedTitle ?? movie.originalTitle;

  return [
    ...tag("title", titled(movie.code, displayTitle)),
    ...tag("originaltitle", titled(movie.code, movie.originalTitle)),
    ...tag("premiered", movie.releasedAt),
    ...tag("studio", movie.studio),
    ...movie.genres.flatMap((genre) => tag("genre", genre)),
    ...tag("rating", movie.rating),
    ...movie.actors.flatMap((actor) => [
      `<actor><name>${escapeXml(actor)}</name><role></role><order></order></actor>`,
    ]),
    ...tag("director", movie.director),
  ].join("\n");
};
