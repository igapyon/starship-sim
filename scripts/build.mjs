import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const templatePath = path.join(rootDir, 'index-src.html');
const outputPath = path.join(rootDir, 'index.html');

const cssFiles = [
  path.join(rootDir, 'src', 'css', 'app.css'),
];

const jsFiles = [
  path.join(rootDir, 'src', 'js', 'app.js'),
];

async function concatFiles(files) {
  const parts = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    parts.push(content.trimEnd());
  }
  return parts.join('\n\n');
}

async function build() {
  const template = await readFile(templatePath, 'utf8');
  const css = await concatFiles(cssFiles);
  const js = await concatFiles(jsFiles);

  const cssLinkTag = '<link rel="stylesheet" href="src/css/app.css">';
  const jsScriptTag = '<script src="src/js/app.js"></script>';

  if (!template.includes(cssLinkTag) || !template.includes(jsScriptTag)) {
    throw new Error('index-src.html does not contain expected dev asset tags');
  }

  const html = template
    .replace(cssLinkTag, `<style>\n${css}\n    </style>`)
    .replace(jsScriptTag, `<script>\n${js}\n    </script>`);

  await writeFile(outputPath, html, 'utf8');
  console.log('Built index.html by inlining dev assets from index-src.html');
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
