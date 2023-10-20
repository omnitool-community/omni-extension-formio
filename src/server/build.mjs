import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

console.log("Building ....")
await esbuild.build({
    entryPoints: ['./extension.ts'],
    bundle: true,
    platform: 'node',
    target: ['esNext'],
    format: 'esm',
    external: ['omni-shared', 'omni-sockets'],
    color: true,
    outdir: '../../server/'
}).catch((ex) =>
{
    console.error(ex)
    process.exit(1)
}).then(() =>
console.log("Build complete")
)