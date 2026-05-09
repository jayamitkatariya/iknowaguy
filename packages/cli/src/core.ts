/**
 * Core CLI logic - routes commands
 */
import { Init } from './commands/init.js';
import { Start } from './commands/start.js';
import { Stop } from './commands/stop.js';
import { Status } from './commands/status.js';
import { Version } from './commands/version.js';

export interface Command {
  name: string;
  description: string;
  run(args: string[]): Promise<void>;
}

const commands: Record<string, Command> = {
  init: new Init(),
  start: new Start(),
  stop: new Stop(),
  status: new Status(),
  version: new Version(),
};

export async function run(commandName: string, args: string[]): Promise<void> {
  const cmd = commands[commandName];
  if (!cmd) {
    console.error(`Unknown command: ${commandName}`);
    console.error(`Run 'iknowaguy' to see available commands.`);
    process.exit(1);
  }
  await cmd.run(args);
}