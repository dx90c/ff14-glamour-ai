import { defineConfig } from 'vite';
export default defineConfig({base:'./',publicDir:false,build:{outDir:'release-ocr',assetsInlineLimit:0,rollupOptions:{input:'release-ocr.js',output:{format:'iife',inlineDynamicImports:true,entryFileNames:'ocr.js'}}}});
