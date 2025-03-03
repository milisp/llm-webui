import { writable } from 'svelte/store';
import type { Conversation, Message } from '../types';
import { nanoid } from 'nanoid';

export const activeConversationId = writable();

export function handleNewConversation() {
  conversations.createConversation();
  history.pushState({}, '', `/c/${activeConversationId}`);
}

function createConversationsStore() {
  // Load initial conversations from localStorage, if available
  const storedConversations = localStorage.getItem('conversations');
  const initialConversations = storedConversations
    ? JSON.parse(storedConversations)
    : [];

  const { subscribe, update, set } = writable<Conversation[]>(initialConversations);

  // Helper function to save conversations to localStorage
  function saveToLocalStorage(conversations: Conversation[]) {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }

  return {
    subscribe,
    createConversation: (title: string = 'New conversation') => {
      const id = nanoid();
      const conversation: Conversation = {
        id,
        title,
        messages: [],
        createdAt: new Date()
      };

      update(conversations => {
        const newConversations = [conversation, ...conversations];
        saveToLocalStorage(newConversations); // Save to localStorage
        return newConversations;
      });
      activeConversationId.set(id)
      return id;
    },
    addMessage: (conversationId: string, message: Message) => {
      update(conversations => {
        const newConversations = conversations.map(conv => {
          if (conv.id === conversationId) {
            let title = conv.title;
            if (conv.messages.length === 0 && message.role === 'user') {
              title = message.content.split('\n')[0].substring(0, 30);
              if (title.length === 30) title += '...';
            }

            return {
              ...conv,
              title,
              messages: [...conv.messages, message]
            };
          }
          return conv;
        });

        saveToLocalStorage(newConversations); // Save to localStorage
        return newConversations;
      });
    },
    updateLastMessage: (conversationId: string, content: string) => {
      update(conversations => {
        const newConversations = conversations.map(conv => {
          if (conv.id === conversationId && conv.messages.length > 0) {
            const messages = [...conv.messages];
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content
            };

            return {
              ...conv,
              messages
            };
          }
          return conv;
        });

        saveToLocalStorage(newConversations); // Save to localStorage
        return newConversations;
      });
    },
    editMessage: (conversationId: string, messageIndex: number, newMessage: Message) => {
      update(conversations => {
        const newConversations = conversations.map(conv => {
          if (conv.id === conversationId && conv.messages.length > messageIndex) {
            const updatedMessages = [...conv.messages];
            updatedMessages[messageIndex] = newMessage;
            updatedMessages.length = messageIndex + 1;
            
            return {
              ...conv,
              messages: updatedMessages
            };
          }
          return conv;
        });
    
        return newConversations;
      });
    },
    changeTitle: (conversationId: string, title: string) => {
      update(conversations => {
        const newConversations = conversations.map(conv => {
          if (conv.id === conversationId && conv.messages.length > 0) {
            return {
              ...conv,
              title
            };
          }
          return conv;
        });
        saveToLocalStorage(newConversations);
        return newConversations;
      });
    },
    deleteConversation: (id: string) => {
      update(conversations => {
        const newConversations = conversations.filter(conv => conv.id !== id);
        saveToLocalStorage(newConversations);
        return newConversations;
      });
    }
  };
}

export const conversations = createConversationsStore();