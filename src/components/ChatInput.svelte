<script lang="ts">
    import { isStreaming } from "../stores/common";
  
    export let onSubmit: (text: string) => void;
    export let onStop: () => void;
  
    let messageText = "";
  
    function handleSubmit(event: SubmitEvent) {
      event.preventDefault();
      if (!messageText.trim() || $isStreaming) return;
      onSubmit(messageText);
      messageText = "";
    }
  </script>
  
  <div class="sticky bottom-0 bg-white shadow-lg z-10 border-t border-gray-300 dark:border-gray-700">
    <form on:submit={handleSubmit} class="flex">
      <input
        type="text"
        bind:value={messageText}
        placeholder="Type a message..."
        class="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        disabled={$isStreaming}
      />
  
      {#if $isStreaming}
        <button
          type="button"
          on:click={onStop}
          class="bg-red-500 text-white p-2 rounded-md"
        >
          stop
        </button>
      {:else}
        <button
          type="submit"
          disabled={!messageText.trim()}
          class="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
        >
          send
        </button>
      {/if}
    </form>
  </div>