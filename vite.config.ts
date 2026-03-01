import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
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
    };
});
