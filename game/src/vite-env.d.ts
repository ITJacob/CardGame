/// <reference types="vite/client" />

/** 由 vite define 在构建时注入（见 vite.config.ts 与 src/data/version.ts） */
declare const __DATA_VERSION__: import('./data/version').DataVersion
