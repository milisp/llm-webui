import type { Message, StreamController } from '../types';

const apiKey = import.meta.env.OLLAMA_API_KEY || 'ollama'
const url = import.meta.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const apiUrl = `${url}/v1/chat/completions`

export async function* streamChatCompletion(messages: Message[], model: string): AsyncGenerator<string> {
  // Create AbortController for this stream
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Store the controller in the global registry for access
  streamControllers.set(messages, controller);
  
  try {
    const response = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

export async function getChatSummary(historyMessages: Message[], model: 'llama3.2') {
  const prompt = `
You are an assistant that generates a short and clear **title** for a conversation history.
Please read the following conversation history and return a concise title (5-10 words) that summarizes the conversation topic.
Only return the title, no other text.

Conversation history:
${historyMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
  `;

  const body = {
      model: model,
      messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
      ],
      temperature: 0.5
  };

  const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
  });

  const data = await response.json();
  if (response.ok) {
      return data.choices[0].message.content.trim();
  } else {
      console.error('Error from OpenAI API:', data);
      return null;
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