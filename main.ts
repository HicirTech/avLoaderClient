import { runPipeline } from "./src/app.ts";

try {
  await runPipeline();
} catch (error) {
  console.error("Pipeline failed:", error);
  Deno.exitCode = 1;
}
