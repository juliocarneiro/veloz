#!/usr/bin/env node
// npm create veloz@latest [dir] [-- --template app|ssr] [--install | --no-install]
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import {
  TEMPLATES,
  detectPackageManager,
  isEmptyDir,
  runCommands,
  scaffold,
  toPackageName,
} from './lib/scaffold.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const color = process.stdout.hasColors?.() ?? false;
const paint = (code) => (text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = paint(1);
const dim = paint(2);
const accent = paint(33);
const green = paint(32);
const red = paint(31);

const HELP = `
${bold('create-veloz')} ${dim(version)}

Usage:
  npm create veloz@latest [dir] -- [options]

Options:
  -t, --template <name>  ${TEMPLATES.map((t) => `${t.name} (${t.description.toLowerCase()})`).join(', ')}
      --install          install dependencies without asking
      --no-install       skip installing dependencies
  -h, --help             show this message
`;

function fail(message) {
  console.error(`\n${red('✖')} ${message}\n`);
  process.exit(1);
}

async function ask(question, fallback) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`${accent('?')} ${bold(question)} ${dim(`(${fallback})`)} `)).trim();
    return answer || fallback;
  } finally {
    rl.close();
  }
}

/** Arrow-key list. Resolves with the chosen item. */
function select(question, items) {
  return new Promise((done) => {
    let index = 0;
    const { stdin, stdout } = process;
    const draw = (first) => {
      if (!first) stdout.write(`\x1b[${items.length}A`);
      for (const [i, item] of items.entries()) {
        const line = i === index ? `${accent('›')} ${bold(item.title)}  ${dim(item.description)}` : `  ${item.title}  ${dim(item.description)}`;
        stdout.write(`\x1b[2K${line}\n`);
      }
    };
    const onKey = (_text, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        stdout.write('\n');
        process.exit(130);
      }
      if (key.name === 'up' || key.name === 'k') index = (index + items.length - 1) % items.length;
      else if (key.name === 'down' || key.name === 'j') index = (index + 1) % items.length;
      else if (key.name === 'return' || key.name === 'enter') {
        stdin.off('keypress', onKey);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write(`\x1b[${items.length}A\x1b[J${dim('  ' + items[index].title)}\n`);
        done(items[index]);
        return;
      } else return;
      draw(false);
    };
    stdout.write(`${accent('?')} ${bold(question)} ${dim('(↑/↓, enter)')}\n`);
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('keypress', onKey);
    draw(true);
  });
}

async function confirm(question) {
  const answer = await ask(question, 'Y/n');
  return !/^n/i.test(answer);
}

async function main() {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        template: { type: 'string', short: 't' },
        install: { type: 'boolean' },
        'no-install': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (err) {
    fail(`${err.message}\n${HELP}`);
  }
  const { values, positionals } = args;
  if (values.help) {
    console.log(HELP);
    return;
  }

  console.log(`\n${bold('Veloz')} ${dim(`create-veloz ${version}`)}\n`);

  let dir = positionals[0];
  if (!dir) dir = interactive ? await ask('Project name:', 'veloz-app') : 'veloz-app';
  if (!isEmptyDir(dir)) fail(`The folder "${dir}" already exists and is not empty. Pick another name.`);

  let template = values.template;
  if (template && !TEMPLATES.some((t) => t.name === template)) {
    fail(`Unknown template "${template}". Use one of: ${TEMPLATES.map((t) => t.name).join(', ')}.`);
  }
  if (!template) template = interactive ? (await select('Template:', TEMPLATES)).name : 'app';

  const { target } = scaffold({ dir, template, version });
  const pm = detectPackageManager();
  const commands = runCommands(pm);
  console.log(`\n${green('✔')} Created ${bold(toPackageName(target))} from the ${bold(template)} template.`);

  let install = values['no-install'] ? false : values.install;
  if (install === undefined) install = interactive ? await confirm(`Install dependencies with ${pm}?`) : false;

  let installed = false;
  if (install) {
    console.log('');
    const result = spawnSync(pm, ['install'], { cwd: target, stdio: 'inherit', shell: process.platform === 'win32' });
    installed = result.status === 0;
    if (!installed) console.log(`\n${red('✖')} Install failed. Run ${bold(commands.install)} in the project folder to retry.`);
  }

  const cd = relative(process.cwd(), target);
  console.log(`\nNext:\n`);
  if (cd) console.log(`  ${accent(`cd ${cd.includes(' ') ? `"${cd}"` : cd}`)}`);
  if (!installed) console.log(`  ${accent(commands.install)}`);
  console.log(`  ${accent(commands.dev)}\n`);
  console.log(dim('Docs: https://veloz-site.vercel.app\n'));
}

main().catch((err) => fail(err?.message ?? String(err)));
