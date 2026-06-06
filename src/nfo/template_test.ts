import { assertEquals } from "@std/assert";
import { DEFAULT_NFO_TEMPLATE, renderNfoDocument } from "./template.ts";

Deno.test("renderNfoDocument renders the typed template object", () => {
  const output = renderNfoDocument([
    "<title>Example</title>",
    "<genre>Drama</genre>",
  ], DEFAULT_NFO_TEMPLATE);

  assertEquals(output.includes('<?xml version="1.0" encoding="UTF-8"'), true);
  assertEquals(output.includes("<movie>"), true);
  assertEquals(output.includes("<title>Example</title>"), true);
  assertEquals(output.includes("</movie>"), true);
});
