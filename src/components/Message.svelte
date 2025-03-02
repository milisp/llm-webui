<script lang="ts">
  import { writable } from "svelte/store";
  import type { Message } from "../types";
  import SvelteMarkdown from 'svelte-markdown';
  import CodeRenderer from "./CodeRenderer.svelte";

  export let message: Message;

  // Function to get avatar for different roles
  function getAvatar(role: string) {
    switch (role) {
      case "user":
        return `
          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            U
          </div>
        `;
      case "assistant":
        return `
          <div class="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
            AI
          </div>
        `;
      case "system":
        return `
          <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
            S
          </div>
        `;
      default:
        return "";
    }
  }

  // Function to get background color based on role
  function getBackgroundColor(role: string) {
    switch (role) {
      case "user":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "assistant":
        return "bg-green-50 dark:bg-green-900/20";
      case "system":
        return "bg-gray-50 dark:bg-gray-900/40";
      default:
        return "";
    }
  }
  
</script>

<div class="mb-1 {getBackgroundColor(message.role)} p-2 rounded-lg">
  <div class="flex gap-3">
    <!-- <div class="flex-shrink-0">
      {@html getAvatar(message.role)}
    </div> -->
    <div class="flex-1">
       <SvelteMarkdown source={message.content} renderers={{ code: CodeRenderer }}  />
    </div>
  </div>
</div>