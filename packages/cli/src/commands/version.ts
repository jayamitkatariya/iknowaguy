import * as chalkNS from "chalk"; const chalk = chalkNS.default;
import { readConfig } from "../lib/config.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8"));
    return pkg.version || "0.1.0";
  } catch {
    return "0.1.0";
  }
}

const W = chalk.white.bold;
const G = chalk.gray;
const C = chalk.cyan;

export class Version {
  name = "version";
  description = "Show version info";

  async run(_args: string[]): Promise<void> {
    console.log(W("\n📦 iknowaguy Version\n"));
    console.log(C("CLI version: ") + W(getVersion()));

    const config = readConfig();
    if (config) {
      console.log(C("Tenant ID: ") + W(config.tenant_id));
      console.log(C("Platform: ") + W(config.platform_url));
    } else {
      console.log(G("Not initialized"));
    }
    console.log("");
  }
}
