/**
 * HireAHuman ASCII Art Banner System — Voxe Edition
 * High contrast white on black, clean and sharp
 */

import * as chalk from 'chalk';

// Voxe style: white dominant, black bg feel via bold
const WHITE = chalk.white.bold;
const WHITE_DIM = chalk.white;
const GRAY = chalk.gray;
const ACCENT = chalk.white; // single accent — white itself

// Main banner — big HIREAHUMAN logo in white
export function printBanner(): void {
  const banner = `
${WHITE('████████╗██████╗ ██╗██╗  ██╗ █████╗ ██╗    ██╗ ██████╗ ███╗   ██╗')}
${WHITE('╚══██╔══╝██╔══██╗██║██║ ██╔╝██╔══██╗██║    ██║██╔═══██╗████╗  ██║')}
${WHITE('   ██║   ██████╔╝██║█████╔╝ ███████║██║ █╗ ██║██║   ██║██╔██╗ ██║')}
${WHITE('   ██║   ██╔══██╗██║██╔═██╗ ██╔══██║██║███╗██║██║   ██║██║╚██╗██║')}
${WHITE('   ██║   ██║  ██║██║██║  ██╗██║  ██║╚███╔███╔╝╚██████╔╝██║ ╚████║')}
${WHITE('   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚═══╝  ╚═════╝ ╚═╝  ╚═══╝')}

${GRAY('─────────────────────────────────────────────────────────────────────')}
${WHITE('           AI agents bring humans into the loop')}
${GRAY('─────────────────────────────────────────────────────────────────────')}
`;
  console.log(banner);
}

// Mini banner for individual commands — white box, white text
export function printMiniBanner(command: string): void {
  const w = WHITE;
  const borders: Record<string, string> = {
    init: `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  ⚡  INITIALIZE PROJECT                   ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
    dev: `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  🚀  START DEVELOPMENT                    ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
    'setup:agent': `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  🔗  LINK AI AGENT                       ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
    'setup:notify': `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  🔔  NOTIFICATIONS SETUP                 ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
    'setup:payments': `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  💰  PAYMENTS SETUP                      ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
    config: `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  ⚙  SHOW CONFIGURATION                   ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
    doctor: `
  ${w('┌──────────────────────────────────────────┐')}
  ${w('│')}  🩺  DIAGNOSE ISSUES                     ${w('│')}
  ${w('└──────────────────────────────────────────┘')}`,
  };

  const box = borders[command] || borders['init'] || '';
  if (box) console.log(box);
}

// Success banner — white box, white text
export function printSuccess(action: string, message: string): void {
  console.log(`
${WHITE('╔══════════════════════════════════════════════════╗')}
${WHITE('║')}  ✅  ${action.padEnd(42)}  ${WHITE('║')}
${WHITE('╠══════════════════════════════════════════════════╣')}
${WHITE('║')}  ${WHITE_DIM(message.padEnd(48))}  ${WHITE('║')}
${WHITE('╚══════════════════════════════════════════════════╝')}
`);
}

// Error banner — white box, white text (no red, just bold white)
export function printError(action: string, message: string): void {
  console.log(`
${WHITE('╔══════════════════════════════════════════════════╗')}
${WHITE('║')}  ❌  ${action.padEnd(42)}  ${WHITE('║')}
${WHITE('╠══════════════════════════════════════════════════╣')}
${WHITE('║')}  ${WHITE_DIM(message.padEnd(48))}  ${WHITE('║')}
${WHITE('╚══════════════════════════════════════════════════╝')}
`);
}

// Warning banner
export function printWarning(action: string, message: string): void {
  console.log(`
${WHITE('╔══════════════════════════════════════════════════╗')}
${WHITE('║')}  ⚠️  ${action.padEnd(42)}  ${WHITE('║')}
${WHITE('╠══════════════════════════════════════════════════╣')}
${WHITE('║')}  ${WHITE_DIM(message.padEnd(48))}  ${WHITE('║')}
${WHITE('╚══════════════════════════════════════════════════╝')}
`);
}

// Loading spinner — white dots
export class Spinner {
  private frames = ['◐', '◓', '◑', '◒', '◐', '◓', '◑', '◒'];
  private index = 0;
  private message: string;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(message: string) {
    this.message = message;
  }

  start(): void {
    process.stdout.write(`\r${WHITE(this.frames[0])}  ${WHITE_DIM(this.message)}`);
    this.interval = setInterval(() => {
      this.index = (this.index + 1) % this.frames.length;
      process.stdout.write(`\r${WHITE(this.frames[this.index])}  ${WHITE_DIM(this.message)}`);
    }, 100);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
  }

  succeed(msg?: string): void {
    this.stop();
    console.log(`${WHITE('✔')}  ${msg || this.message}`);
  }

  fail(msg?: string): void {
    this.stop();
    console.log(`${WHITE('✖')}  ${msg || this.message}`);
  }
}

// Section divider — white line
export function printSection(label: string): void {
  const line = '─'.repeat(48);
  console.log(`\n${WHITE(line)}`);
  console.log(`  ${WHITE(label)}`);
  console.log(`${WHITE(line)}\n`);
}

// Label + value row — for config show, status, etc.
export function printRow(label: string, value: string): void {
  console.log(`  ${WHITE_DIM(label.padEnd(28))}  ${WHITE(value)}`);
}

// Table — white lines, white text
export function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) => {
    const maxRow = Math.max(...rows.map((r) => (r[i] || '').length));
    return Math.max(h.length, maxRow) + 2;
  });

  const border = '+' + colWidths.map((w) => '─'.repeat(w)).join('+') + '+';
  const headerRow =
    '|' +
    headers.map((h, i) => WHITE(h.padEnd(colWidths[i])).toString()).join('|') +
    '|';

  console.log(WHITE(border));
  console.log(headerRow);
  console.log(WHITE(border));
  rows.forEach((row) => {
    const rowStr =
      '|' +
      row.map((cell, i) => WHITE_DIM(cell.padEnd(colWidths[i])).toString()).join('|') +
      '|';
    console.log(rowStr);
  });
  console.log(WHITE(border));
}

// Key-value dump for config / doctor output
export function printKV(key: string, value: string, ok?: boolean): void {
  if (ok !== undefined) {
    const icon = ok ? WHITE('✔') : WHITE('✖');
    console.log(`  ${icon}  ${WHITE_DIM(key.padEnd(30))}  ${WHITE(value)}`);
  } else {
    console.log(`  ${WHITE_DIM(key.padEnd(32))}  ${WHITE(value)}`);
  }
}

// Separator
export function printSep(): void {
  console.log(WHITE('  ───────────────────────────────────────────────'));
}
