<script lang="ts">
  import type { Conversation } from "../types";
  import {
    conversations as conversationsStore,
    activeConversationId,
  } from "../stores/conversations";
  import { isOpen } from "../stores/common";
  import { Cog, Trash, UserCircle } from "svelte-heros-v2";

  export let onSelectConversation: (id: string) => void;
  export let onNewConversation: () => void;
  export let conversations: Conversation[];

  function deleteConversation(id: string) {
    conversationsStore.deleteConversation(id);
    if ($activeConversationId == id) {
      conversationsStore.createConversation();
    }
  }
</script>

<!-- Overlay when sidebar is open -->
{#if $isOpen}
  <button
    class="fixed inset-0 bg-black opacity-50 z-10"
    on:click={() => ($isOpen = !$isOpen)}>-</button
  >
  {/if}

{#if $isOpen}

  <div class="h-screen w-64 bg-gray-200 dark:bg-gray-900 flex flex-col z-20">
    <div
      class="flex justify-between p-2 border-b border-gray-300 dark:border-gray-700"
    >
      <button class="" on:click={() => ($isOpen = !$isOpen)}> 🌙 </button>
      <button class="" on:click={onNewConversation}>📝</button>
    </div>

    <div class="flex-1 overflow-y-auto">
      {#each conversations as conversation}
        <div
          class="flex justify-between hover:bg-gray-300 dark:hover:bg-gray-800 {$activeConversationId ===
          conversation.id
            ? 'bg-gray-300 dark:bg-gray-800'
            : ''}"
        >
          <button
            on:click={() => onSelectConversation(conversation.id)}
            class="truncate p-3 w-full hover:bg-blue-500 text-left"
            >{conversation.title}</button
          >
          <button
            class="hover:bg-red-500"
            on:click={() => deleteConversation(conversation.id)}
            ><Trash /></button
          >
        </div>
      {/each}
    </div>
    <footer class="flex justify-between p-4">
      <span><UserCircle /></span>
      <span> <Cog /></span>
    </footer>
  </div>
{/if}
