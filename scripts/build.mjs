import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { validateJsOrder } from './build-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const templatePath = path.join(rootDir, 'index-src.html');
const outputPath = path.join(rootDir, 'index.html');

const cssFiles = [
  path.join(rootDir, 'src', 'css', 'app.css'),
];

const expectedJsOrder = [
  // DOM参照とイベント登録のベース（canvas/ctx/resize など）
  'src/js/main.js',
  // チーム定義（ID/表示名/色/関係）
  'src/js/teams.js',
  // Hull/Engine/Radar/Weapon の基礎クラス定義
  'src/js/components.js',
  // Bullet/Particle/DetectionBeacon。TEAM_DEFINITIONS を実行時参照
  'src/js/projectiles-effects.js',
  // Starship本体。components / projectile classes に依存
  'src/js/starship.js',
  // グローバル状態と initializeGame。Starship/IndependentTurretB に依存
  'src/js/scenes.js',
  // updateTeam/animate。全クラスと各種グローバル状態に依存
  'src/js/game-loop.js',
];

const moduleNames = [
  'main',
  'teams',
  'components',
  'projectiles-effects',
  'starship',
  'scenes',
  'game-loop',
];
const tsFiles = moduleNames.map((name) => path.join(rootDir, 'src', 'ts', `${name}.ts`));
const jsFiles = moduleNames.map((name) => path.join(rootDir, 'src', 'js', `${name}.js`));

async function concatFiles(files) {
  const parts = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    parts.push(content.trimEnd());
  }
  return parts.join('\n\n');
}

async function compileTsToJs() {
  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.None,
    strict: false,
  };

  for (let i = 0; i < tsFiles.length; i++) {
    const tsFilePath = tsFiles[i];
    const jsFilePath = jsFiles[i];
    const source = await readFile(tsFilePath, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions,
      fileName: tsFilePath,
      reportDiagnostics: true,
    });

    if (transpiled.diagnostics && transpiled.diagnostics.length > 0) {
      const diagnostics = transpiled.diagnostics
        .map((d) => typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText)
        .join('\n');
      throw new Error(`TypeScript transpile error in ${tsFilePath}:\n${diagnostics}`);
    }

    await writeFile(jsFilePath, transpiled.outputText, 'utf8');
  }
}

async function build() {
  const template = await readFile(templatePath, 'utf8');
  validateJsOrder(template, expectedJsOrder);
  await compileTsToJs();

  const css = await concatFiles(cssFiles);
  const js = await concatFiles(jsFiles);

  const cssLinkTag = '<link rel="stylesheet" href="src/css/app.css">';
  const jsScriptTags = expectedJsOrder.map((relativePath) => `<script src="${relativePath}"></script>`);

  if (!template.includes(cssLinkTag)) {
    throw new Error('index-src.html does not contain expected css tag');
  }
  for (const tag of jsScriptTags) {
    if (!template.includes(tag)) {
      throw new Error(`index-src.html does not contain expected js tag: ${tag}`);
    }
  }

  const inlineCssTag = `<style>\n${css}\n    </style>`;
  const inlineJsTag = `<script>\n${js}\n    </script>`;

  const lines = template.split('\n');
  const out = [];
  let jsInlined = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === cssLinkTag) {
      out.push(`    ${inlineCssTag.replace(/\n/g, '\n    ')}`);
      continue;
    }

    if (jsScriptTags.includes(trimmed)) {
      if (!jsInlined) {
        out.push(`    ${inlineJsTag.replace(/\n/g, '\n    ')}`);
        jsInlined = true;
      }
      continue;
    }

    out.push(line);
  }

  const html = out.join('\n');

  await writeFile(outputPath, html, 'utf8');
  console.log('Built index.html by inlining dev assets from index-src.html');
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
