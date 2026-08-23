import { assertEquals } from "@std/assert";

import {
  containsObfuscatedWebsite,
  isDomain,
  normalizeBaseName,
  normalizeObfuscatedWebsite,
  stripLeadingSourceMarker,
  stripLeadingWebsiteSource,
  stripReleaseSuffix,
} from "./nameRules.ts";

Deno.test("normalizeObfuscatedWebsite closes up a domain spaced out to dodge filters", () => {
  assertEquals(normalizeObfuscatedWebsite("h h d 8 0 0 . c o m@ABC-123"), "hhd800.com@ABC-123");
  assertEquals(containsObfuscatedWebsite("h h d 8 0 0 . c o m"), true);
});

Deno.test("normalizeObfuscatedWebsite leaves ordinary spaced text alone", () => {
  // Only fragments that compact into a real domain are touched.
  assertEquals(normalizeObfuscatedWebsite("A B C . D"), "A B C . D");
  assertEquals(containsObfuscatedWebsite("still life . jpg"), false);
  assertEquals(isDomain("hhd800.com"), true);
  assertEquals(isDomain("abc.d"), false);
});

Deno.test("stripLeadingWebsiteSource removes stacked leading domains", () => {
  assertEquals(stripLeadingWebsiteSource("javdb.com ABC-123"), "ABC-123");
  assertEquals(stripLeadingWebsiteSource("[javdb.com]ABC-123"), "ABC-123");
  assertEquals(stripLeadingWebsiteSource("www.a.com-b.net_ABC-123"), "ABC-123");
});

Deno.test("stripLeadingSourceMarker keeps a code that merely contains an at sign", () => {
  // The old rule cut at the LAST "@" anywhere in the name, so this became
  // "4K rip" and the video code was gone for good.
  assertEquals(stripLeadingSourceMarker("DEF-456 @ 4K rip"), "DEF-456 @ 4K rip");
  assertEquals(stripLeadingSourceMarker("ABC-123 [1080p]"), "ABC-123 [1080p]");
});

Deno.test("stripLeadingSourceMarker removes a real source prefix", () => {
  assertEquals(stripLeadingSourceMarker("hhd800.com@ABC-123"), "ABC-123");
  assertEquals(stripLeadingSourceMarker("[JAV]ABC-123"), "ABC-123");
});

Deno.test("stripReleaseSuffix drops the cut marker", () => {
  assertEquals(stripReleaseSuffix("ABC-123-C"), "ABC-123");
  assertEquals(stripReleaseSuffix("ABC-123-u"), "ABC-123");
  assertEquals(stripReleaseSuffix("ABC-123-CU"), "ABC-123");
  assertEquals(stripReleaseSuffix("ABC-123"), "ABC-123");
});

Deno.test("stripReleaseSuffix does not eat a code that ends in those letters", () => {
  assertEquals(stripReleaseSuffix("ABCU-123"), "ABCU-123");
  assertEquals(stripReleaseSuffix("ABC-123C"), "ABC-123C");
});

Deno.test("normalizeBaseName runs the whole chain", () => {
  assertEquals(normalizeBaseName("h h d 8 0 0 . c o m@ABC-123-C"), "ABC-123");
  assertEquals(normalizeBaseName("[javdb.com] DEF-456 "), "DEF-456");
  assertEquals(normalizeBaseName("GHI-789"), "GHI-789");
});

Deno.test("normalizeBaseName keeps the original rather than returning nothing", () => {
  assertEquals(normalizeBaseName("javdb.com"), "javdb.com");
});
