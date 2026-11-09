// Project generation, kept free of prompts and process exits so it can be tested.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEMPLATES_DIR = fileURLToPath(new URL('../templates/', import.meta.url));

/** @type {{ name: string, title: string, description: string }[]} */
export const TEMPLATES = [
  { name: 'app', title: 'App', description: 'Single-page app with Vite' },
  { name: 'ssr', title: 'SSR', description: 'Server rendering, hydration and async data' },
];

// npm drops .gitignore from published packages, so templates ship it renamed.
const RENAMES = { _gitignore: '.gitignore' };

/** Turns a folder name into a valid npm package name. */
export function toPackageName(dir) {
  const name = basename(resolve(dir))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]+/, '')
    .replace(/[^a-z0-9~._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return name || 'veloz-app';
}

/** The package manager that ran `create`, from npm_config_user_agent. */
export function detectPackageManager(userAgent = process.env.npm_config_user_agent ?? '') {
  const name = userAgent.split(' ')[0]?.split('/')[0];
  return name === 'pnpm' || name === 'yarn' || name === 'bun' ? name : 'npm';
}

/** Commands to run the project with a given package manager. */
export function runCommands(pm) {
  return {
    install: pm === 'yarn' ? 'yarn' : `${pm} install`,
    dev: pm === 'npm' ? 'npm run dev' : `${pm} dev`,
  };
}

/** True when the folder does not exist or holds nothing but a .git folder. */
export function isEmptyDir(dir) {
  if (!existsSync(dir)) return true;
  return readdirSync(dir).every((f) => f === '.git');
}

/**
 * The dependency range for Veloz packages. All packages are released together,
 * so `^major.minor.0` of this package matches the published versions even when
 * create-veloz itself got a newer patch.
 */
export function velozRange(version) {
  const [major = '0', minor = '0'] = version.split('.');
  return `^${major}.${minor}.0`;
}

/**
 * Copies a template into `dir` and fills in the project name and versions.
 * @param {{ dir: string, template: string, version: string }} options
 */
export function scaffold({ dir, template, version }) {
  if (!TEMPLATES.some((t) => t.name === template)) {
    throw new Error(`Unknown template "${template}". Use one of: ${TEMPLATES.map((t) => t.name).join(', ')}.`);
  }
  const target = resolve(dir);
  if (!isEmptyDir(target)) throw new Error(`${target} is not empty.`);

  mkdirSync(target, { recursive: true });
  cpSync(join(TEMPLATES_DIR, template), target, { recursive: true });

  for (const [from, to] of Object.entries(RENAMES)) {
    if (existsSync(join(target, from))) renameSync(join(target, from), join(target, to));
  }

  const name = toPackageName(target);
  const range = velozRange(version);
  for (const file of ['package.json', 'index.html', 'README.md']) {
    const path = join(target, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8')
      .replaceAll('__PROJECT_NAME__', name)
      .replaceAll('__VELOZ_VERSION__', range);
    writeFileSync(path, text);
  }
  return { target, name };
}
