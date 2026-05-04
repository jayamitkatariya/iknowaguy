/**
 * Build script for @hireahuman/sdk
 * Compiles TypeScript and generates declaration files
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Clean and create dist directory
const distDir = join(__dirname, 'dist');
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}
mkdirSync(distDir, { recursive: true });

console.log('Building @hireahuman/sdk...');

// Compile TypeScript
try {
  execSync('npx tsc', { 
    cwd: __dirname, 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  console.log('TypeScript compilation complete');
} catch (error) {
  console.error('TypeScript compilation failed');
  process.exit(1);
}

// Copy package.json to dist
cpSync(join(__dirname, 'package.json'), join(distDir, 'package.json'));

// Copy README if exists
if (existsSync(join(__dirname, 'README.md'))) {
  cpSync(join(__dirname, 'README.md'), join(distDir, 'README.md'));
}

console.log('Build complete!');
