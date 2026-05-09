/**
 * iknowaguy CLI - Local-first CLI tool for AI agents to bring humans into the loop
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { run } from './core.js';

const args = process.argv.slice(2);

async function main() {
  if (args.length === 0) {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════╗
║                    iknowaguy CLI                       ║
║     Give your AI agents access to human workers        ║
╚═══════════════════════════════════════════════════════╝
`));
    console.log(`Usage: ${chalk.green('iknowaguy')} ${chalk.yellow('<command>')} [options]\n`);
    console.log(`${chalk.bold('Commands:')}`);
    console.log(`  ${chalk.green('init')}      Initialize iknowaguy (register tenant)`);
    console.log(`  ${chalk.green('start')}     Start API server and MCP server`);
    console.log(`  ${chalk.green('stop')}      Stop running servers`);
    console.log(`  ${chalk.green('status')}    Check if servers are running`);
    console.log(`  ${chalk.green('version')}   Show version info\n`);
    console.log(`Run ${chalk.green('iknowaguy <command> --help')} for more information.\n`);
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