import type { Message, StreamController } from '../types';

const API_KEY = "ollama"; // You'll need to set your OpenAI API key here
const url = 'http://192.168.6.5:11434/v1/chat/completions'

export async function* streamChatCompletion(messages: Message[], model: string): AsyncGenerator<string> {
  // Create AbortController for this stream
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Store the controller in the global registry for access
  streamControllers.set(messages, controller);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true
      }),
      signal // Connect the abort signal to the fetch request
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Unknown error');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
        
        try {
          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.slice(6);
            const json = JSON.parse(jsonStr);
            
            if (json.choices?.[0]?.delta?.content) {
              yield json.choices[0].delta.content;
            }
          }
        } catch (error) {
          console.error('Error parsing stream:', error);
        }
      }
    }
  } finally {
    // Clean up by removing the controller from the registry
    streamControllers.delete(messages);
  }
}

// Track active stream controllers by their message arrays
const streamControllers = new Map<Message[], AbortController>();

export function createStreamController(): StreamController {
  return {
    abort: () => {
      // Abort all active controllers
      streamControllers.forEach(controller => {
        controller.abort();
      });
      streamControllers.clear();
    }
  };
}