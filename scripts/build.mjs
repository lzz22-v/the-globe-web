import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'dist');
const pages = ['index.html', 'chat.html', 'rooms.html', 'personagens.html', 'profile.html'];

if (dirname(outputDirectory) !== projectRoot || outputDirectory === projectRoot) {
  throw new Error('Diretório de publicação inválido.');
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const page of pages) {
  await cp(resolve(projectRoot, page), resolve(outputDirectory, page));
}

await cp(resolve(projectRoot, 'src'), resolve(outputDirectory, 'src'), { recursive: true });

const publicDirectory = resolve(projectRoot, 'public');
for (const entry of await readdir(publicDirectory)) {
  await cp(resolve(publicDirectory, entry), resolve(outputDirectory, entry), { recursive: true });
}

console.log(`Arquivos de publicação preparados em ${outputDirectory}`);
