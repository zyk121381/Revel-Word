// AI Service Abstraction Layer
// Supports both OpenAI and Gemini APIs

export interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
  apiBase?: string;
  model: string;
}

interface GenerateContentOptions {
  prompt: string;
  responseSchema?: any;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  systemInstruction?: string;
  history?: ChatMessage[];
}

// OpenAI Service
class OpenAIService {
  private apiKey: string;
  private apiBase: string;
  private model: string;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.apiBase = (config.apiBase || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.model = config.model;
  }

  async generateContent(options: GenerateContentOptions): Promise<{ text: string }> {
    const messages: any[] = [];
    
    if (options.responseSchema) {
      messages.push({
        role: 'system',
        content: this.buildSchemaInstruction(options.responseSchema),
      });
    }
    
    messages.push({
      role: 'user',
      content: options.prompt,
    });

    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        response_format: options.responseSchema ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (options.responseSchema) {
      try {
        const parsed = JSON.parse(text);
        return { text: JSON.stringify(parsed) };
      } catch (e) {
        return { text };
      }
    }

    return { text };
  }

  async createChat(options: ChatOptions) {
    return new OpenAIChat(this, options);
  }

  private buildSchemaInstruction(schema?: any): string {
    if (!schema) return '';

    return `You must respond with valid JSON only. Follow this schema structure:
${JSON.stringify(schema, null, 2)}`;
  }
}

class OpenAIChat {
  private service: OpenAIService;
  private history: ChatMessage[];
  private systemInstruction?: string;

  constructor(service: OpenAIService, options: ChatOptions) {
    this.service = service;
    this.history = options.history || [];
    this.systemInstruction = options.systemInstruction;
  }

  async sendMessage({ message }: { message: string }): Promise<{ text: string }> {
    const messages: ChatMessage[] = [];

    if (this.systemInstruction) {
      messages.push({ role: 'system', content: this.systemInstruction });
    }

    messages.push(...this.history);
    messages.push({ role: 'user', content: message });

    const response = await fetch(`${this.service['apiBase']}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.service['apiKey']}`,
      },
      body: JSON.stringify({
        model: this.service['model'],
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Update history
    this.history.push({ role: 'user', content: message });
    this.history.push({ role: 'assistant', content: text });

    return { text };
  }
}

// Gemini Service (kept for backward compatibility - optional dependency)
class GeminiService {
  private genAI: any;
  private model: string;

  constructor(config: AIConfig) {
    try {
      // Try to dynamically import Gemini
      const { GoogleGenAI } = require('@google/genai');
      this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
      this.model = config.model;
    } catch (error) {
      throw new Error('Gemini SDK is not installed. Install it with: npm install @google/genai');
    }
  }

  async generateContent(options: GenerateContentOptions): Promise<{ text: string }> {
    const response = await this.genAI.models.generateContent({
      model: this.model,
      contents: options.prompt,
      config: options.responseSchema ? {
        responseMimeType: "application/json",
        responseSchema: options.responseSchema,
      } : undefined,
    });

    return { text: response.text || '' };
  }

  async createChat(options: ChatOptions) {
    const chat = this.genAI.chats.create({
      model: this.model,
      config: {
        systemInstruction: options.systemInstruction,
      }
    });

    return {
      async sendMessage({ message }: { message: string }): Promise<{ text: string }> {
        const response = await chat.sendMessage({ message });
        return { text: response.text || '' };
      }
    };
  }
}

// Factory function to create AI service
export function createAIService(config: Partial<AIConfig> = {}): any {
  // Get config from environment variables
  const provider = config.provider ||
    (process.env.NEXT_PUBLIC_AI_PROVIDER as 'openai' | 'gemini') || 'openai';

  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('[AI Service] Provider:', provider);
    if (provider === 'openai') {
      console.log('[AI Service] API Base:', process.env.NEXT_PUBLIC_OPENAI_API_BASE || 'https://api.openai.com/v1');
      console.log('[AI Service] Model:', process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini');
      console.log('[AI Service] API Key:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Set' : 'Not set');
    }
  }

  if (provider === 'openai') {
    return new OpenAIService({
      provider: 'openai',
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      apiBase: config.apiBase || process.env.NEXT_PUBLIC_OPENAI_API_BASE || 'https://api.openai.com/v1',
      model: config.model || process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
    });
  } else {
    return new GeminiService({
      provider: 'gemini',
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      model: config.model || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-3.1-pro-preview',
    });
  }
}

export { OpenAIService, GeminiService, OpenAIChat };
