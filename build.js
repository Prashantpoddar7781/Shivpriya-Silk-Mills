import { build as viteBuild } from 'vite';
import { build as esBuild } from 'esbuild';

const isClientOnly = process.argv.includes('--client-only');

console.log('Building Vite SPA client...');
await viteBuild();

if (!isClientOnly) {
  console.log('Building server bundle with esbuild...');
  await esBuild({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs',
  });
  console.log('Server build complete.');
}
