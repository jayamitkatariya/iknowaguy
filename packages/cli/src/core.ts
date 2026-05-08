import { Command } from './commands/command';
import { Init } from './commands/init';
import { Dev } from './commands/dev';
import { SetupAgent } from './commands/setup-agent';
import { SetupNotify } from './commands/setup-notify';
import { SetupPayments } from './commands/setup-payments';
import { Config } from './commands/config';
import { Doctor } from './commands/doctor';

const commands: Record<string, Command> = {
  init: new Init(),
  dev: new Dev(),
  'setup:agent': new SetupAgent(),
  'setup:notify': new SetupNotify(),
  'setup:payments': new SetupPayments(),
  config: new Config(),
  doctor: new Doctor(),
};

export async function runWithArgs(args: string[]): Promise<void> {
  const [cmdName, ...rest] = args;
  const cmd = commands[cmdName];
  if (!cmd) {
    console.error(`Unknown command: ${cmdName}`);
    console.error('Run "iknowaguy" to see available commands.');
    process.exit(1);
  }
  await cmd.run(rest);
}

export async function run(): Promise<void> {
  await runWithArgs(process.argv.slice(2));
}
