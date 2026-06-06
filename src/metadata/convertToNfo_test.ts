import { assertEquals } from "@std/assert";
import { convertToNfo } from "./convertToNfo.ts";

Deno.test("convertToNfo maps backend alias keys into NFO tags", async () => {
  const output = await convertToNfo({
    ID: ["AIAV"],
    "Released Date": ["2026-06-04"],
    Maker: ["ノースキンズ/maryGOLD"],
    Tags: ["Submissive Men", "Idol"],
    "Actor(s)": ["Alice"],
    Rating: ["8.5"],
    原标题: "测试标题",
  });

  assertEquals(output.includes("<title>[AIAV]测试标题</title>"), true);
  assertEquals(output.includes("<premiered>2026-06-04</premiered>"), true);
  assertEquals(output.includes("<studio>ノースキンズ/maryGOLD</studio>"), true);
  assertEquals(output.includes("<genre>Submissive Men</genre>"), true);
  assertEquals(output.includes("<genre>Idol</genre>"), true);
  assertEquals(output.includes("<rating>8.5</rating>"), true);
  assertEquals(
    output.includes(
      "<actor><name>Alice</name><role></role><order></order></actor>",
    ),
    true,
  );
});
