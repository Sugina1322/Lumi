import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const seedDir = path.join(root, 'supabase', 'seed');
const chunksDir = path.join(seedDir, 'chunks');
const baseSeedFile = path.join(seedDir, 'transit_seed.sql');
const runOrderFile = path.join(chunksDir, '000_run_order.txt');

function parseArgs(argv) {
  const options = {
    dbUrl: null,
    skipBase: false,
    startAt: null,
  };

  for (const arg of argv) {
    if (arg.startsWith('--db-url=')) {
      options.dbUrl = arg.slice('--db-url='.length);
      continue;
    }

    if (arg === '--skip-base') {
      options.skipBase = true;
      continue;
    }

    if (arg.startsWith('--start-at=')) {
      options.startAt = arg.slice('--start-at='.length);
    }
  }

  if (!options.dbUrl && process.env.SUPABASE_DB_URL) {
    options.dbUrl = process.env.SUPABASE_DB_URL;
  }

  return options;
}

function readRunOrder() {
  if (!fs.existsSync(runOrderFile)) {
    throw new Error(`Missing run order file: ${runOrderFile}`);
  }

  return fs
    .readFileSync(runOrderFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.endsWith('.sql'));
}

function resolveFiles(options) {
  const files = [];

  if (!options.skipBase) {
    files.push(baseSeedFile);
  }

  const orderedChunkFiles = readRunOrder().map((name) => path.join(chunksDir, name));
  files.push(...orderedChunkFiles);

  if (!options.startAt) {
    return files;
  }

  const normalizedStart = options.startAt.toLowerCase();
  const startIndex = files.findIndex((file) => path.basename(file).toLowerCase() === normalizedStart);

  if (startIndex === -1) {
    throw new Error(`Could not find --start-at target: ${options.startAt}`);
  }

  return files.slice(startIndex);
}

function runCommand(command, args, label) {
  const isCmdShim = command.toLowerCase().endsWith('.cmd');
  const executable = isCmdShim ? 'C:\\Windows\\System32\\cmd.exe' : command;
  const executableArgs = isCmdShim ? ['/c', command, ...args] : args;

  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function commandExists(command) {
  if (path.isAbsolute(command)) {
    return fs.existsSync(command);
  }

  const isWindows = process.platform === 'win32';

  if (isWindows) {
    const lookup = spawnSync('C:\\Windows\\System32\\where.exe', [command], {
      cwd: root,
      stdio: 'pipe',
      shell: false,
      encoding: 'utf8',
    });

    return lookup.status === 0;
  }

  const lookup = spawnSync('which', [command], {
    cwd: root,
    stdio: 'pipe',
    shell: false,
    encoding: 'utf8',
  });

  return lookup.status === 0;
}

function executeSqlFile(file, options) {
  const cliArgs = ['db', 'query'];

  if (options.dbUrl) {
    cliArgs.push('--db-url', options.dbUrl);
  } else {
    cliArgs.push('--linked');
  }

  cliArgs.push('--file', file);

  const attempts = [
    { command: 'supabase', args: cliArgs, label: 'supabase CLI' },
    { command: 'supabase.exe', args: cliArgs, label: 'supabase CLI' },
    { command: 'supabase.cmd', args: cliArgs, label: 'supabase CLI' },
    { command: 'npx.cmd', args: ['supabase', ...cliArgs], label: 'npx supabase CLI' },
    { command: 'C:\\Program Files\\nodejs\\npx.cmd', args: ['supabase', ...cliArgs], label: 'npx supabase CLI' },
    { command: 'C:\\Program Files\\nodejs\\npm.cmd', args: ['exec', 'supabase', '--', ...cliArgs], label: 'npm exec supabase CLI' },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    if (!commandExists(attempt.command)) {
      continue;
    }

    try {
      runCommand(attempt.command, attempt.args, attempt.label);
      return;
    } catch (error) {
      lastError = error;
      const message = String(error?.message ?? error);
      const isMissingBinary =
        message.includes('ENOENT') ||
        message.includes('not recognized') ||
        message.includes('could not be found');

      if (!isMissingBinary) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Could not find a usable Supabase CLI command on PATH');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = resolveFiles(options);

  console.log(`Applying ${files.length} SQL files...`);
  if (options.dbUrl) {
    console.log('Using --db-url from argument or SUPABASE_DB_URL');
  } else {
    console.log('Using linked Supabase project');
  }

  files.forEach((file, index) => {
    console.log(`[${index + 1}/${files.length}] ${path.relative(root, file)}`);
    executeSqlFile(file, options);
  });

  console.log('Transit seed import finished.');
}

main();
