import { load } from "@std/dotenv";

export interface AppConfig {
  targetPath: string;
  host: string;
  cookie: string;
  extension: string;
  outputDir: string;
  delayMs: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  targetPath: "Z:\\Garage\\临时",
  host: "http://192.168.10.102:5000",
  cookie: "",
  extension: "mp4",
  outputDir: "./output",
  delayMs: 5000,
};

export const loadConfig = async (): Promise<AppConfig> => {
  await load({ envPath: ".env", export: true });

  return {
    targetPath: Deno.env.get("TARGET_PATH") ?? DEFAULT_CONFIG.targetPath,
    host: Deno.env.get("METADATA_HOST") ?? DEFAULT_CONFIG.host,
    cookie: Deno.env.get("JAVDB_COOKIE") ?? DEFAULT_CONFIG.cookie,
    extension: Deno.env.get("TARGET_EXTENSION") ?? DEFAULT_CONFIG.extension,
    outputDir: Deno.env.get("OUTPUT_DIR") ?? DEFAULT_CONFIG.outputDir,
    delayMs: Number(Deno.env.get("FETCH_DELAY_MS") ?? DEFAULT_CONFIG.delayMs),
  };
};
