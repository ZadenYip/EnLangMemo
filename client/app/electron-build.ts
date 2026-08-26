import { build } from "esbuild"

build({
    entryPoints: {
        "main": "app/main.ts",
    },
    bundle: true,
    platform: "node",
    target: "es2022",
    format: "esm",
    sourcemap: true,
    packages: "external",
    outdir: "app/",
}).catch(() => process.exit(1));

// package electron-ipc-cat is pure JS, must bundle it
build({
    entryPoints: {
        "preload": "app/preload.ts"
    },
    bundle: true,
    platform: "node",
    target: "es2022",
    // must be cjs to be compatible with electron preload script when electron sandbox is enabled
    format: "cjs",
    sourcemap: true,
    external: [
        "electron"
    ],
    outdir: "app/",
}).catch(() => process.exit(1));
