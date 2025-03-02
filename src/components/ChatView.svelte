<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import type { Conversation, Message, StreamController } from "../types";
  import { conversations } from "../stores/conversations";
  import MessageComponent from "./Message.svelte";
  import { streamChatCompletion, createStreamController } from "../lib/api";
  import { writable } from "svelte/store";
  import { isOpen, isStreaming } from "../stores/common";

  export let conversation: Conversation;

  let messageText = "";
  let chatContainer: HTMLElement;
  let streamController: StreamController | null = null;
  let editingMessageId: number | null = null;
  let isEditing = false;

  async function sendMessage() {
    if ($isStreaming) return;
    if (isEditing) {
      console.log(editingMessageId, new Date());
    } else if (!messageText.trim()) {
      return;
    }

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: messageText,
    };

    if (!isEditing) {
      conversations.addMessage(conversation.id, userMessage);
    }
    messageText = "";

    // Create empty assistant message that will be filled by the stream
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      model: $selectedModel,
    };

    conversations.addMessage(conversation.id, assistantMessage);

    try {
      isStreaming.set(true);
      isEditing = false;
      streamController = createStreamController();

      // Create message array for API
      // Include all messages EXCEPT the empty assistant message we just added
      const apiMessages = conversation.messages.slice(0, -1);

      // FIX: Make sure we have at least one message (the user message)
      if (apiMessages.length === 0) {
        // This shouldn't happen, but let's fix it anyway
        apiMessages.push(userMessage);
      }

      // Start streaming
      const stream = streamChatCompletion(apiMessages, $selectedModel);
      let fullResponse = "";

      for await (const chunk of stream) {
        fullResponse += chunk;
        conversations.updateLastMessage(conversation.id, fullResponse);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error during streaming:", error);
        conversations.updateLastMessage(
          conversation.id,
          `Error: ${error.message || "Failed to get response"}`,
        );
      }
    } finally {
      isStreaming.set(false);
      streamController = null;
    }
  }

  function stopStreaming() {
    if (streamController) {
      streamController.abort();
      streamController = null;
      isStreaming.set(false);
    }
  }

  afterUpdate(() => {
    if (!isEditing) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  const selectedModel = writable("llama3.2");
  const models = ["llama3.2", "deepseek-r1:7b"];

  function onNewConversation() {
    conversations.createConversation();
  }

  function setEditingMessageId(msgIdx: number) {
    isEditing = false;
    editingMessageId = null;
  }
  function startEditingMessage(msgIdx: number) {
    isEditing = true;
    editingMessageId = msgIdx;
  }
  async function handleEditSubmit(msgIdx: number) {
    conversations.editMessage(
      conversation.id,
      msgIdx,
      conversation.messages[msgIdx],
    );
    await sendMessage();
    editingMessageId = null;
  }
</script>

<div class="flex-1 flex flex-col h-full max-w-screen">
  <header class="p-2 sticky top-0 bg-white dark:bg-gray-700 shadow-lg z-10">
    {#if $isOpen}
      <select bind:value={$selectedModel}>
        {#each models as m}
          <option value={m}>
            {m}
          </option>
        {/each}
      </select>
    {:else}
      <div class="flex justify-between">
        <button on:click={() => ($isOpen = !$isOpen)}> ⚡️ </button>
        <select bind:value={$selectedModel}>
          {#each models as m}
            <option value={m}>
              {m}
            </option>
          {/each}
        </select>
        <button class="" on:click={onNewConversation}>📝</button>
      </div>
    {/if}
  </header>
  <!-- Chat messages -->
  <div class="flex-1 overflow-y-auto" bind:this={chatContainer}>
    {#if conversation.messages.length === 0}
      <div class="h-full flex items-center justify-center">
        <div class="text-center">👇</div>
      </div>
    {:else}
      {#each conversation.messages as message, msgIdx}
        {#if message.role === "user"}
          <div class="flex-1">
            {#if editingMessageId === msgIdx && isEditing}
              <div class="mt-2">
                <textarea
                  bind:value={message.content}
                  class="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:border-blue-500"
                  rows={Math.min(message.content.split("\n").length, 1)}
                ></textarea>
                <div class="flex justify-end mt-2 space-x-2">
                  <button
                    on:click={() => setEditingMessageId(msgIdx)}
                    class="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    on:click={() => handleEditSubmit(msgIdx)}
                    class="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save & Regenerate
                  </button>
                </div>
              </div>
            {:else}
              <MessageComponent {message} />
            {/if}
          </div>
        {:else}
          <MessageComponent {message} />
        {/if}
        <div class="font-semibold flex justify-between">
          {#if message.role === "user" && !isEditing}
            <button
              on:click={() => startEditingMessage(msgIdx)}
              class="text-xs text-blue-500 hover:text-blue-700"
            >
              Edit
            </button>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
  <!-- Input area -->
  <div
    class="sticky bottom-0 bg-white shadow-lg z-10 border-t border-gray-300 dark:border-gray-700"
  >
    <form on:submit|preventDefault={sendMessage} class="flex">
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
          on:click={stopStreaming}
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
</div>
