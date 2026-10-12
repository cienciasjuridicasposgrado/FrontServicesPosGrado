import { readFile } from 'node:fs/promises';

const angularConfig = JSON.parse(await readFile(new URL('../angular.json', import.meta.url), 'utf8'));
const productionEnvironment = await readFile(
  new URL('../src/environments/environment.production.ts', import.meta.url),
  'utf8'
);
const developmentEnvironment = await readFile(
  new URL('../src/environments/environment.ts', import.meta.url),
  'utf8'
);
const indexHtml = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/lexi-favicon.svg', import.meta.url), 'utf8');

const replacements = angularConfig.projects?.frontend?.architect?.build
  ?.configurations?.production?.fileReplacements ?? [];
const expectedReplacement = replacements.some((replacement) =>
  replacement.replace === 'src/environments/environment.ts' &&
  replacement.with === 'src/environments/environment.production.ts'
);

if (!expectedReplacement) {
  throw new Error('Production must replace environment.ts with environment.production.ts.');
}

if (!developmentEnvironment.includes("apiUrl: 'http://localhost:3000'")) {
  throw new Error('Development must keep the expected local backend URL.');
}

if (/localhost|http:\/\/|https:\/\//i.test(productionEnvironment)) {
  throw new Error('Production environment must use a deployable relative API URL.');
}

if (!productionEnvironment.includes("apiUrl: '/api'")) {
  throw new Error("Production apiUrl must be the documented '/api' reverse-proxy path.");
}

const assets = angularConfig.projects?.frontend?.architect?.build?.options?.assets ?? [];
if (!assets.some((asset) => asset.input === 'public' && asset.glob === '**/*') ||
    !indexHtml.includes('href="lexi-favicon.svg"') ||
    !favicon.includes('<svg')) {
  throw new Error('Lexi favicon must be referenced in index.html and copied from public/.');
}

console.log('Environment configuration verified.');
