import * as chalkNS from "chalk"; const chalk = chalkNS.default;
import { readConfig, writeConfig, CONFIG_FILE } from "../lib/config.js";

const C = chalk.green;
const W = chalk.white.bold;
const Y = chalk.yellow;
const DEFAULT_PLATFORM_URL = "https://iknowaguy.com";

export class Init {
  name = "init";
  description = "Initialize iknowaguy (register with the platform)";

  async run(args: string[]): Promise<void> {
    console.log(W("\n🚀 Initializing iknowaguy\n"));

    const existing = readConfig();
    if (existing) {
      console.log(C("✅ iknowaguy is already initialized!"));
      console.log(`   Tenant ID: ${existing.tenant_id}`);
      console.log(`   Platform: ${existing.platform_url || DEFAULT_PLATFORM_URL}`);
      console.log(`   Config: ${CONFIG_FILE}\n`);
      console.log('Run "iknowaguy start" to start the MCP proxy.\n');
      return;
    }

    let name = "My Workspace";
    let email = "";
    let password = "";
    let platformUrl = DEFAULT_PLATFORM_URL;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--name" && args[i + 1]) { name = args[i + 1]; i++; }
      else if (args[i] === "--email" && args[i + 1]) { email = args[i + 1]; i++; }
      else if (args[i] === "--password" && args[i + 1]) { password = args[i + 1]; i++; }
      else if (args[i] === "--platform" && args[i + 1]) { platformUrl = args[i + 1]; i++; }
    }

    if (!email || !password) {
      console.log(Y("📋 To initialize, provide --email and --password:"));
      console.log('   iknowaguy init --email you@example.com --password "YourPassword123" [--name "My Workspace"] [--platform https://iknowaguy.com]\n');
      return;
    }

    const slug = email.split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase() + "-" + Date.now().toString(36);

    console.log(C("📡 Connecting to platform..."));

    try {
      const res = await fetch(`${platformUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, email, password }),
      });

      const data: any = await res.json();

      if (!res.ok) {
        console.log(chalk.red(`\n❌ Registration failed: ${data?.error || res.statusText}\n`));
        process.exit(1);
      }

      if (data.data?.api_key) {
        writeConfig({
          version: "0.1.0",
          tenant_id: data.data.tenant?.id || data.data.tenant_id,
          api_key: data.data.api_key,
          platform_url: platformUrl,
        });

        console.log(C("\n✅ You're connected! API key saved.\n"));
        console.log(`   Tenant: ${data.data.tenant?.id || data.data.tenant_id}`);
        console.log(`   Platform: ${platformUrl}`);
        console.log(W("\nNext step:"));
        console.log("  Run " + C("iknowaguy start") + " to start the MCP proxy\n");
        console.log("Config saved to: " + CONFIG_FILE + "\n");
      } else {
        console.log(chalk.red("\n❌ No API key received from platform\n"));
        process.exit(1);
      }
    } catch (err: any) {
      console.log(chalk.red(`\n❌ Could not connect to platform at ${platformUrl}`));
      console.log(chalk.red(`   Error: ${err.message}\n`));
      console.log("Make sure the platform is running and accessible.\n");
      process.exit(1);
    }
  }
}
