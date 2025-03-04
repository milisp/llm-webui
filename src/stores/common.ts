// stores.js
import { writable } from 'svelte/store';

export const isOpen = writable(false);
export const isStreaming = writable(false);
export const selectedModel = writable('llama3.2')