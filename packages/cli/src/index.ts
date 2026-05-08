#!/usr/bin/env node
import chalk from 'chalk';
import { run, runWithArgs } from './core';
import { printBanner } from './lib/ascii';

const args = process.argv.slice(2);

if (args.length === 0) {
  printBanner();
  console.log(`${chalk.white.bold('Usage:')} ${chalk.cyan('iknowaguy <command>')} ${chalk.gray('[options]')}\n`);
  console.log(`${chalk.white.bold('Commands:')}\n`);
  console.log(`  ${chalk.green('init')}             Initialize iknowaguy in your project`);
  console.log(`  ${chalk.green('dev')}              Start local development server`);
  console.log(`  ${chalk.green('setup:agent')}      Link your AI agent (OpenClaw/Hermes/Claude)`);
  console.log(`  ${chalk.green('setup:notify')}     Configure notification channels`);
  console.log(`  ${chalk.green('setup:payments')}   Configure payment provider`);
  console.log(`  ${chalk.green('config')}           Show current configuration`);
  console.log(`  ${chalk.green('doctor')}           Diagnose setup issues\n`);
  console.log(`${chalk.gray('Run "iknowaguy <command> --help" for more info.\n')}`);
  process.exit(0);
}

runWithArgs(args).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
