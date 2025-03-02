// src/types.ts
export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    timestamp?: Date;
    edited?: boolean;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
}

export interface StreamController {
    abort: () => void;
}
  