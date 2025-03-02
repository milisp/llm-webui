import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import {mdsvex} from 'mdsvex';
import path from 'path';

export default {
  preprocess: vitePreprocess(),
  extensions: ['.svelte', '.svx'],
  preprocess: mdsvex(),
  kit: {
    // Add necessary configurations for SvelteKit
    vite: {
      resolve: {
        alias: {
          $lib: path.resolve('./src/lib')
        }
      }
    }
  }
};
