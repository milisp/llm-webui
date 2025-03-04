<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { PencilSquare, ArrowPath, ClipboardDocument } from "svelte-heros-v2";

  import type { Conversation, Message, StreamController } from "../types";
  import { conversations } from "../stores/conversations";
  import MessageComponent from "./Message.svelte";
  import {
    streamChatCompletion,
    createStreamController,
    getChatSummary,
  } from "../lib/api";
  import { isOpen, isStreaming, selectedModel } from "../stores/common";
  import CopyButton from "./CopyButton.svelte";
  import ChatInput from "./ChatInput.svelte";
  import SelectModel from "./SelectModel.svelte";

  export let conversation: Conversation;

  let messageText = "";
  let chatContainer: HTMLElement;
  let streamController: StreamController | null = null;
  let editingMessageId: number | null = null;
  let isEditing = false;
  let copied = false;

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
    let newConv = $conversations.find((c) => c.id == conversation.id);

    try {
      isStreaming.set(true);
      isEditing = false;
      streamController = createStreamController();

      const apiMessages = newConv?.messages.slice(0, -1) || [];
      const summary = await getChatSummary(apiMessages, $selectedModel);

      if (apiMessages.length === 0) {
        apiMessages.push(userMessage);
      }

      // Start streaming
      const stream = streamChatCompletion(apiMessages, $selectedModel);
      let fullResponse = "";

      for await (const chunk of stream) {
        fullResponse += chunk;
        conversations.updateLastMessage(conversation.id, fullResponse);
      }
      conversations.changeTitle(conversation.id, summary);
    } catch (error) {
      const err = error as Error;
      if (err.name !== "AbortError") {
        console.error("Error during streaming:", err);
        conversations.updateLastMessage(
          conversation.id,
          `Error: ${err.message || "Failed to get response"}`,
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
    if ($isStreaming && !isEditing) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  function onNewConversation() {
    conversations.createConversation();
  }

  let textareaRefs: { [key: number]: HTMLTextAreaElement | null } = {};
  function setEditingMessageId() {
    isEditing = false;
    editingMessageId = null;
  }
  function startEditingMessage(index: number) {
    isEditing = true;
    editingMessageId = index;
    setTimeout(() => {
      textareaRefs[index]?.focus();
    }, 0);
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
  async function regenerate(msgIdx: number) {
    editingMessageId = msgIdx - 1;
    isEditing = true;
    conversations.editMessage(
      conversation.id,
      msgIdx - 1,
      conversation.messages[msgIdx - 1],
    );
    await sendMessage();
    editingMessageId = null;
  }

  function handleSubmit(text: string) {
    messageText = text;
    sendMessage();
  }
</script>

<div class="flex-1 flex flex-col h-full max-w-screen">
  <header class="p-2 sticky top-0 bg-white dark:bg-gray-700 shadow-lg z-10">
    {#if $isOpen}
      <SelectModel />
    {:else}
      <div class="flex justify-between">
        <button on:click={() => ($isOpen = !$isOpen)}> ⚡️ </button>
        <SelectModel />
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
        <!-- message -->
        <div class="mb-4 flex flex-col gap-2 group">
          {#if message.role === "user"}
            {#if editingMessageId === msgIdx && isEditing}
              <div class="space-y-2">
                <textarea
                  bind:this={textareaRefs[msgIdx]}
                  bind:value={message.content}
                  class="w-full p-3 border border-gray-300 dark:border-gray-600
                 rounded-lg
                 bg-white dark:bg-gray-800 resize-y"
                  rows={Math.max(message.content.split("\n").length, 2)}
                ></textarea>
                <div class="flex justify-end gap-2">
                  <button
                    on:click={() => setEditingMessageId()}
                    class="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700
                   rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    on:click={() => handleEditSubmit(msgIdx)}
                    class="px-4 py-1.5 text-sm bg-blue-600 text-white
                   rounded-md hover:bg-blue-700"
                  >
                    Save & Regenerate
                  </button>
                </div>
              </div>
            {:else}
              <MessageComponent {message} />
            {/if}
          {:else}
            <MessageComponent {message} />
          {/if}

          <!-- action -->
          <div
            class="flex h-2 justify-end gap-3 text-gray-500 dark:text-gray-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <CopyButton {copied} text={message.content} />
            {#if message.role === "user" && !isEditing}
              <button
                on:click={() => startEditingMessage(msgIdx)}
                class="hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="Edit message"
              >
                <PencilSquare />
              </button>
            {:else if message.role === "assistant"}
              <button
                on:click={() => regenerate(msgIdx)}
                class="hover:text-blue-600 dark:hover:text-blue-400"
                aria-label="Regenerate response"
              >
                <ArrowPath />
              </button>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
  <!-- Replace the input area with ChatInput component -->
  <ChatInput onSubmit={handleSubmit} onStop={stopStreaming} />
</div>
