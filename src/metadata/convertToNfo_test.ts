import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";

import { convertToNfo } from "./convertToNfo.ts";
import { readMovie } from "./movie.ts";
import type { Movie } from "./movie.ts";

const MOVIE: Movie = {
  code: "NYKD-145",
  originalTitle: "還暦で初撮り 石川桃子",
  translatedTitle: null,
  releasedAt: "2026-08-18",
  durationMinutes: 118,
  director: "村山恭介",
  studio: "ルビー",
  series: "還暦で初撮り",
  rating: 5,
  voteCount: 7,
  genres: ["熟女", "已婚婦女"],
  actors: ["石川桃子"],
  previewImages: [],
  sourceUrl: "https://javdb.com/v/4DEE4p",
};

Deno.test("convertToNfo writes every tag the library reads", () => {
  const nfo = convertToNfo(MOVIE);

  assertStringIncludes(nfo, "<title>[NYKD-145]還暦で初撮り 石川桃子</title>");
  assertStringIncludes(nfo, "<originaltitle>[NYKD-145]還暦で初撮り 石川桃子</originaltitle>");
  assertStringIncludes(nfo, "<premiered>2026-08-18</premiered>");
  assertStringIncludes(nfo, "<studio>ルビー</studio>");
  assertStringIncludes(nfo, "<genre>熟女</genre>");
  assertStringIncludes(nfo, "<genre>已婚婦女</genre>");
  assertStringIncludes(nfo, "<actor><name>石川桃子</name><role></role><order></order></actor>");
});

Deno.test("convertToNfo writes rating and director, which the alias table used to drop", () => {
  // The server emitted the traditional labels 評分 and 導演 while the old alias
  // table only listed the simplified 评分 and 导演, so neither tag was ever
  // written. Typed fields make that class of miss impossible.
  const nfo = convertToNfo(MOVIE);

  assertStringIncludes(nfo, "<rating>5</rating>");
  assertStringIncludes(nfo, "<director>村山恭介</director>");
});

Deno.test("convertToNfo prefers the translated title but keeps the original", () => {
  const nfo = convertToNfo({ ...MOVIE, translatedTitle: "六十岁初次拍摄" });

  assertStringIncludes(nfo, "<title>[NYKD-145]六十岁初次拍摄</title>");
  assertStringIncludes(nfo, "<originaltitle>[NYKD-145]還暦で初撮り 石川桃子</originaltitle>");
});

Deno.test("convertToNfo omits absent fields rather than writing empty tags", () => {
  const nfo = convertToNfo({
    ...MOVIE,
    releasedAt: null,
    director: null,
    studio: null,
    rating: null,
    genres: [],
    actors: [],
  });

  assertEquals(nfo.includes("<premiered>"), false);
  assertEquals(nfo.includes("<director>"), false);
  assertEquals(nfo.includes("<rating>"), false);
  assertEquals(nfo.includes("<genre>"), false);
  assertEquals(nfo.includes("<actor>"), false);
  assertStringIncludes(nfo, "<title>");
});

Deno.test("convertToNfo escapes characters that would break the XML", () => {
  const nfo = convertToNfo({ ...MOVIE, studio: `A & B <"C">` });
  assertStringIncludes(nfo, "<studio>A &amp; B &lt;&quot;C&quot;&gt;</studio>");
});

Deno.test("readMovie accepts a well-formed response", () => {
  const movie = readMovie({ ...MOVIE });
  assertEquals(movie.code, "NYKD-145");
  assertEquals(movie.rating, 5);
  assertEquals(movie.genres, ["熟女", "已婚婦女"]);
});

Deno.test("readMovie rejects an error body rather than turning it into an empty nfo", () => {
  // This is the failure that used to poison the library: a 401 body was written
  // to disk, and a present .nfo means finished for good.
  assertThrows(
    () => readMovie({ error: "cloudflare_clearance_required", detail: "stale" }),
    Error,
    "not a movie",
  );
});

Deno.test("readMovie rejects a body that is not an object", () => {
  assertThrows(() => readMovie("ok"), Error, "not a JSON object");
  assertThrows(() => readMovie(null), Error, "not a JSON object");
});

Deno.test("readMovie drops fields of the wrong type instead of trusting them", () => {
  const movie = readMovie({
    code: "X-1",
    originalTitle: "t",
    rating: "5",
    genres: ["ok", 42, ""],
    director: 7,
  });

  assertEquals(movie.rating, null);
  assertEquals(movie.director, null);
  assertEquals(movie.genres, ["ok"]);
});
