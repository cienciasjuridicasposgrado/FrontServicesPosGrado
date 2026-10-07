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

console.log('Environment configuration verified.');
