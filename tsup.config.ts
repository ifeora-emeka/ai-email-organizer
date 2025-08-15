import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server/server.ts'],
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: false,
  minify: process.env.NODE_ENV === 'production',
  watch: process.env.NODE_ENV === 'development',
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production'
  }
});
