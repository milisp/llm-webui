import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import {mdsvex} from 'mdsvex';
import path from 'path';

export default {
  preprocess: vitePreprocess(),
  extensions: ['.svelte'],
  preprocess: mdsvex()
};
