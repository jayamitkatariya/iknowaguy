import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface Config {
  version: string;
  tenant_id: string;
  api_key: string;
  platform_url: string;
}

export const CONFIG_DIR = join(homedir(), ".iknowaguy");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");
export const RUN_DIR = join(CONFIG_DIR, "run");

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function readConfig(): Config | null {
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as Config;
  } catch {
    return null;
  }
}

export function writeConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  chmodSync(CONFIG_FILE, 0o600);
}

export function readPid(name: string): number | null {
  const pidFile = join(RUN_DIR, `${name}.pid`);
  if (!existsSync(pidFile)) return null;
  try {
    return parseInt(readFileSync(pidFile, "utf-8").trim(), 10);
  } catch {
    return null;
  }
}

export function writePid(name: string, pid: number): void {
  mkdirSync(RUN_DIR, { recursive: true });
  writeFileSync(join(RUN_DIR, `${name}.pid`), pid.toString());
}

export function removePid(name: string): void {
  const pidFile = join(RUN_DIR, `${name}.pid`);
  if (existsSync(pidFile)) {
    try { unlinkSync(pidFile); } catch {}
  }
}
