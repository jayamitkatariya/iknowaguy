import * as chalkNS from "chalk"; const chalk = chalkNS.default;
import { run } from "./core.js";

const args = process.argv.slice(2);

async function main() {
  if (args.length === 0) {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════╗
║                    iknowaguy CLI                       ║
║     Give your AI agents access to human workers        ║
╚═══════════════════════════════════════════════════════╝
`));
    console.log(`Usage: ${chalk.green("iknowaguy")} ${chalk.yellow("<command>")} [options]\n`);
    console.log(`${chalk.bold("Commands:")}`);
    console.log(`  ${chalk.green("init")}      Register with the iknowaguy platform`);
    console.log(`  ${chalk.green("start")}     Start the MCP proxy for AI agents`);
    console.log(`  ${chalk.green("stop")}      Stop the MCP proxy`);
    console.log(`  ${chalk.green("status")}    Check if the MCP proxy is running`);
    console.log(`  ${chalk.green("version")}   Show version info\n`);
    process.exit(0);
  }

  const [command, ...rest] = args;
  try {
    await run(command, rest);
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

main();
