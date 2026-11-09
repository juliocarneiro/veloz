import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error plain JS module without type declarations
import * as lib from '../lib/scaffold.js';

const { scaffold, toPackageName, detectPackageManager, runCommands, velozRange, TEMPLATES } = lib;
const CLI = fileURLToPath(new URL('../index.js', import.meta.url));
const tmp = () => mkdtempSync(join(tmpdir(), 'create-veloz-'));
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

describe('create-veloz helpers', () => {
  it('turns folder names into valid package names', () => {
    expect(toPackageName('My App')).toBe('my-app');
    expect(toPackageName('/projects/Cool_Site!')).toBe('cool_site');
    expect(toPackageName('.hidden')).toBe('hidden');
    expect(toPackageName('!!!')).toBe('veloz-app');
  });

  it('detects the package manager that ran create', () => {
    expect(detectPackageManager('pnpm/11.1.2 npm/? node/v22.22.3 win32 x64')).toBe('pnpm');
    expect(detectPackageManager('yarn/4.5.0 npm/? node/v22')).toBe('yarn');
    expect(detectPackageManager('bun/1.2.0')).toBe('bun');
    expect(detectPackageManager('npm/11.0.0 node/v22')).toBe('npm');
    expect(detectPackageManager('')).toBe('npm');
    expect(runCommands('npm')).toEqual({ install: 'npm install', dev: 'npm run dev' });
    expect(runCommands('yarn')).toEqual({ install: 'yarn', dev: 'yarn dev' });
  });

  it('pins Veloz packages to the released minor line', () => {
    expect(velozRange('0.1.1')).toBe('^0.1.0');
    expect(velozRange('1.4.2')).toBe('^1.4.0');
  });
});

describe('scaffold', () => {
  for (const { name: template } of TEMPLATES) {
    it(`creates a ready-to-install project from the ${template} template`, () => {
      const dir = join(tmp(), 'My Project');
      scaffold({ dir, template, version: '0.1.1' });

      const pkg = readJson(join(dir, 'package.json'));
      expect(pkg.name).toBe('my-project');
      expect(pkg.dependencies['@velozjs/dom']).toBe('^0.1.0');
      expect(pkg.devDependencies['vite-plugin-veloz']).toBe('^0.1.0');
      expect(JSON.stringify(pkg)).not.toContain('__');

      expect(existsSync(join(dir, '.gitignore'))).toBe(true);
      expect(existsSync(join(dir, '_gitignore'))).toBe(false);
      expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('<title>my-project</title>');
      expect(readFileSync(join(dir, 'README.md'), 'utf8')).toContain('# my-project');
      expect(readJson(join(dir, 'tsconfig.json')).compilerOptions.jsxImportSource).toBe('@velozjs/dom');
      expect(readFileSync(join(dir, 'vite.config.ts'), 'utf8')).toContain('veloz()');
    });
  }

  it('adds the SSR runtime and server only to the ssr template', () => {
    const app = join(tmp(), 'a');
    const ssr = join(tmp(), 's');
    scaffold({ dir: app, template: 'app', version: '0.1.1' });
    scaffold({ dir: ssr, template: 'ssr', version: '0.1.1' });
    expect(readJson(join(app, 'package.json')).dependencies['@velozjs/ssr']).toBeUndefined();
    expect(readJson(join(ssr, 'package.json')).dependencies['@velozjs/ssr']).toBe('^0.1.0');
    expect(existsSync(join(ssr, 'server.js'))).toBe(true);
    expect(existsSync(join(app, 'server.js'))).toBe(false);
  });

  it('refuses a folder that already has files, but accepts one with only .git', () => {
    const dir = tmp();
    writeFileSync(join(dir, 'notes.txt'), 'keep me');
    expect(() => scaffold({ dir, template: 'app', version: '0.1.1' })).toThrow(/not empty/);
    expect(readFileSync(join(dir, 'notes.txt'), 'utf8')).toBe('keep me');

    const repo = tmp();
    mkdirSync(join(repo, '.git'));
    expect(() => scaffold({ dir: repo, template: 'app', version: '0.1.1' })).not.toThrow();
  });

  it('rejects unknown templates', () => {
    expect(() => scaffold({ dir: join(tmp(), 'x'), template: 'nope', version: '0.1.1' })).toThrow(/Unknown template/);
  });
});

describe('create-veloz CLI', () => {
  const run = (args: string[], cwd: string, userAgent = 'pnpm/11.1.2 npm/? node/v22') =>
    spawnSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, npm_config_user_agent: userAgent, NO_COLOR: '1' },
    });

  it('scaffolds without prompts when not run in a terminal and prints the next commands', () => {
    const cwd = tmp();
    const result = run(['shop', '--template', 'ssr'], cwd);
    expect(result.status).toBe(0);
    expect(readJson(join(cwd, 'shop', 'package.json')).name).toBe('shop');
    expect(result.stdout).toContain('cd shop');
    expect(result.stdout).toContain('pnpm install');
    expect(result.stdout).toContain('pnpm dev');
  });

  it('defaults to the app template', () => {
    const cwd = tmp();
    expect(run(['site'], cwd, 'npm/11.0.0').status).toBe(0);
    expect(existsSync(join(cwd, 'site', 'src', 'main.tsx'))).toBe(true);
  });

  it('exits with an error for a non-empty folder or an unknown template', () => {
    const cwd = tmp();
    mkdirSync(join(cwd, 'taken'));
    writeFileSync(join(cwd, 'taken', 'file.txt'), '');
    const taken = run(['taken'], cwd);
    expect(taken.status).toBe(1);
    expect(taken.stderr).toContain('not empty');

    const bad = run(['x', '--template', 'vue'], cwd);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('Unknown template');
    expect(existsSync(join(cwd, 'x'))).toBe(false);
  });

  it('prints help', () => {
    const result = run(['--help'], tmp());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('npm create veloz@latest');
  });
});
