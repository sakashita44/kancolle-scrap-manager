/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// アプリバージョンは package.json を単一のソースとして注入する（手動管理による陳腐化を防ぐ）
const { version: appVersion } = JSON.parse(
    readFileSync(
        fileURLToPath(new URL('./package.json', import.meta.url)),
        'utf-8',
    ),
) as { version: string };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        define: {
            __APP_VERSION__: JSON.stringify(appVersion),
        },
        // サブディレクトリにデプロイする場合は VITE_BASE_PATH を設定
        base: env.VITE_BASE_PATH || '/',
        server: {
            port: 3000,
            open: true,
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
        },
        test: {
            globals: true,
        },
    };
});
