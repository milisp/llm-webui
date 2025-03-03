<script lang="ts">
  import { onMount, tick } from "svelte";
  import Prism from "prismjs";
  import "prismjs/themes/prism.css";
  // Import additional langs as needed
  import "prismjs/components/prism-typescript";
  import "prismjs/components/prism-javascript";
  import "prismjs/components/prism-css";
  import "prismjs/components/prism-json";
  import "prismjs/components/prism-python";
  import "prismjs/components/prism-rust";
  import "prismjs/components/prism-go";
  import "prismjs/components/prism-bash";
  import { isStreaming } from "../stores/common";

  import CopyButton from "./CopyButton.svelte";

  export let lang: string;
  export let text: string;

  let copied = false;
  let codeElement: HTMLElement;

  onMount(() => {
    if (codeElement && lang) {
      Prism.highlightElement(codeElement);
    }
  });

  let isHl = false

  $: if (!$isStreaming && !isHl) {
      if (codeElement && lang) {
        Prism.highlightElement(codeElement);
        isHl = true
      }
}
</script>

<div class="relative max-w-screen">
  <pre class={`language-${lang}`}><code bind:this={codeElement} class={`language-${lang}`}>{text}</code></pre>
  <span class="absolute top-2 right-2">
    <CopyButton {copied} {text} />
  </span>
</div>

<style>
  .language-tag {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    background-color: #4a5568;
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    opacity: 0.7;
  }
</style>
