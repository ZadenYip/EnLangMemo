import { build } from 'esbuild'

build({
    entryPoints: {
        'main': 'app/main.ts',
    },
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    sourcemap: true,
    packages: 'external',
    outdir: 'app/'
}).catch(() => process.exit(1));

// package electron-ipc-cat is pure JS, must bundle it
build({
    entryPoints: {
        'preload': 'app/preload.ts'
    },
    bundle: true,
    platform: 'node',
    target: 'es2020',
    format: 'cjs',
    sourcemap: true,
    external: [
        'electron'
    ],
    outdir: 'app/'
}).catch(() => process.exit(1));
