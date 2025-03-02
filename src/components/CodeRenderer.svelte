<script lang="ts">
  import { onMount } from 'svelte';
  import Prism from 'prismjs';
  import 'prismjs/themes/prism.css';
  // Import additional langs as needed
  import 'prismjs/components/prism-typescript';
  import 'prismjs/components/prism-javascript';
  import 'prismjs/components/prism-css';
  import 'prismjs/components/prism-json';
  import 'prismjs/components/prism-python';
  import 'prismjs/components/prism-bash';
  import { isStreaming } from "../stores/common";
  
  export let lang: string;
  export let text: string;
  
  let copied = false;
  let timeout: ReturnType<typeof setTimeout>;
  let codeElement: HTMLElement;
  
  onMount(() => {
    if (codeElement && lang) {
      Prism.highlightElement(codeElement);
    }
  });

  $: if (!$isStreaming) {
    if (codeElement && lang) {
      Prism.highlightElement(codeElement);
    }
  }
  
  function copyToClipboard() {
    navigator.clipboard.writeText(text)
      .then(() => {
        copied = true;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          copied = false;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  }
</script>

<div class="code-block relative max-w-screen">
  
  <button 
    on:click={copyToClipboard}
    class="copy-button absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded"
  >
    {copied ? '✓ Copied!' : 'Copy'}
  </button>
  
  <pre class={`lang-${lang}`}><code bind:this={codeElement} class={`lang-${lang}`}>{text}</code></pre>
</div>

<style>
  
  pre {
    padding: 1em;
    border-radius: 4px;
    overflow: auto;
    background-color: #f5f5f5;
  }
  
  .copy-button {
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .copy-button:hover {
    opacity: 1;
  }
  
  .lang-tag {
    opacity: 0.7;
  }
</style>

