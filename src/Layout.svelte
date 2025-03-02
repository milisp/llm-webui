<script lang="ts">
  import { onMount } from 'svelte';
  import { conversations, activeConversationId, handleNewConversation } from './stores/conversations';
  import Sidebar from './components/Sidebar.svelte';
  import ChatView from './components/ChatView.svelte';
  import type { Conversation } from './types';
  
  let activeConversation: Conversation | null = null;
  
  $: {
    if ($activeConversationId) {
      activeConversation = $conversations.find(c => c.id === $activeConversationId) || null;
    }
  }
  
  onMount(() => {
    // Create a new conversation if none exists
    if ($conversations.length === 0) {
      conversations.createConversation();
    } else {
      activeConversationId.set($conversations[$conversations.length - 1].id);
    }
    
    // Update URL when conversation changes
    const updateUrl = () => {
      if (activeConversationId) {
        history.pushState({}, '', `/c/${$activeConversationId}`);
      }
    };
    
    // Check URL for conversation ID
    const pathMatch = window.location.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      const urlConversationId = pathMatch[1];
      const exists = $conversations.some(c => c.id === urlConversationId);
      
      if (exists) {
        activeConversationId.set(urlConversationId);
      } else {
        updateUrl();
      }
    } else {
      updateUrl();
    }
  });
  
  function handleSelectConversation(id: string) {
    activeConversationId.set(id)
    history.pushState({}, '', `/c/${$activeConversationId}`);
  }
</script>

<div class="flex h-screen bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
  <!-- Sidebar -->
  <Sidebar 
    conversations={$conversations}
    onSelectConversation={handleSelectConversation}
    onNewConversation={handleNewConversation}
  />

  <!-- Main Chat View -->
  {#if activeConversation}
    <ChatView 
      conversation={activeConversation}
    />
  {:else}
    <div class="flex-1 flex items-center justify-center">
      <p>Select or create a conversation</p>
    </div>
  {/if}
</div>
