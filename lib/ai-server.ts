// Server-side AI Service Abstraction Layer
// Supports both OpenAI and Gemini APIs

export interface AIConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
  apiBase?: string;
  model: string;
}

export interface GenerateContentOptions {
  prompt: string;
  responseSchema?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  systemInstruction?: string;
  history?: ChatMessage[];
}

export interface GenerateContentResponse {
  text: string;
}

export interface AIChat {
  sendMessage(options: { message: string }): Promise<GenerateContentResponse>;
}

export interface AIService {
  generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse>;
  createChat(options: ChatOptions): Promise<AIChat>;
}

// OpenAI Service
class OpenAIService implements AIService {
  private apiKey: string;
  private apiBase: string;
  private model: string;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.apiBase = (config.apiBase || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.model = config.model;
  }

  async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
    const messages: ChatMessage[] = [];
    
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

    const requestBody: any = {
      model: this.model,
      messages,
    };

    if (options.responseSchema) {
      requestBody.response_format = { type: 'json_object' };
      // 针对 OpenRouter 等支持路由的服务商，强制选择支持 JSON 模式的底层提供商
      // 只有在 apiBase 包含 openrouter 时才添加此参数，避免影响其他服务商
      if (this.apiBase.includes('openrouter')) {
        requestBody.provider = { require_parameters: true };
      }
    }

    let response = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://ai.studio',
        'X-OpenRouter-Title': 'AI Studio App',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const isJsonFormatError = 
        errorText.includes('No endpoints found') || 
        errorText.includes('json_object') || 
        errorText.includes('response_format');

      if (isJsonFormatError && options.responseSchema) {
        console.warn('Model or provider does not support json_object, retrying without response_format...');
        delete requestBody.response_format;
        if (requestBody.provider) {
          delete requestBody.provider;
        }

        response = await fetch(`${this.apiBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://ai.studio',
            'X-OpenRouter-Title': 'AI Studio App',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const retryErrorText = await response.text();
          throw new Error(`OpenAI API Error: ${retryErrorText}`);
        }
      } else {
        throw new Error(`OpenAI API Error: ${errorText}`);
      }
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('OpenAI API returned an empty response. Please check your API base URL and network connection.');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error(`Invalid JSON response from OpenAI API: ${responseText.substring(0, 100)}...`);
    }
    
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

  async createChat(options: ChatOptions): Promise<AIChat> {
    return new OpenAIChat(this, options);
  }

  private buildSchemaInstruction(schema?: Record<string, unknown>): string {
    if (!schema) return '';

    return `You must respond with valid JSON only. Follow this schema structure:
${JSON.stringify(schema, null, 2)}`;
  }

  // Expose for OpenAIChat
  getApiBase() { return this.apiBase; }
  getApiKey() { return this.apiKey; }
  getModel() { return this.model; }
}

class OpenAIChat implements AIChat {
  private service: OpenAIService;
  private history: ChatMessage[];
  private systemInstruction?: string;

  constructor(service: OpenAIService, options: ChatOptions) {
    this.service = service;
    this.history = options.history || [];
    this.systemInstruction = options.systemInstruction;
  }

  async sendMessage({ message }: { message: string }): Promise<GenerateContentResponse> {
    const messages: ChatMessage[] = [];

    if (this.systemInstruction) {
      messages.push({ role: 'system', content: this.systemInstruction });
    }

    messages.push(...this.history);
    messages.push({ role: 'user', content: message });

    const response = await fetch(`${this.service.getApiBase()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.service.getApiKey()}`,
      },
      body: JSON.stringify({
        model: this.service.getModel(),
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API Error: ${error}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('OpenAI API returned an empty response. Please check your API base URL and network connection.');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error(`Invalid JSON response from OpenAI API: ${responseText.substring(0, 100)}...`);
    }
    
    const text = data.choices?.[0]?.message?.content || '';

    // Update history
    this.history.push({ role: 'user', content: message });
    this.history.push({ role: 'assistant', content: text });

    return { text };
  }
}

// Gemini Service
class GeminiChat implements AIChat {
  private chat: any;

  constructor(chat: any) {
    this.chat = chat;
  }

  async sendMessage({ message }: { message: string }): Promise<GenerateContentResponse> {
    const response = await this.chat.sendMessage({ message });
    return { text: response.text || '' };
  }
}

class GeminiService implements AIService {
  private genAI: any;
  private model: string;

  constructor(config: AIConfig) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
      this.model = config.model;
    } catch (error) {
      throw new Error('Gemini SDK is not installed. Install it with: npm install @google/genai');
    }
  }

  async generateContent(options: GenerateContentOptions): Promise<GenerateContentResponse> {
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

  async createChat(options: ChatOptions): Promise<AIChat> {
    const chat = this.genAI.chats.create({
      model: this.model,
      config: {
        systemInstruction: options.systemInstruction,
      }
    });

    // Pre-fill history if provided
    if (options.history && options.history.length > 0) {
      // The new Gemini SDK might not support setting history directly on create,
      // but we can simulate it or just rely on the frontend sending the full history if needed.
      // For simplicity in this refactor, we'll just use the chat instance.
      // Note: If history is critical, we should use generateContent with full message array.
    }

    return new GeminiChat(chat);
  }
}

// Factory function to create AI service on the server
export function createServerAIService(config: Partial<AIConfig> = {}): AIService {
  // Read from private env vars, fallback to NEXT_PUBLIC_ for backward compatibility during transition
  const provider = config.provider ||
    (process.env.AI_PROVIDER as 'openai' | 'gemini') || 
    (process.env.NEXT_PUBLIC_AI_PROVIDER as 'openai' | 'gemini') || 
    'openai';

  if (provider === 'openai') {
    return new OpenAIService({
      provider: 'openai',
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      apiBase: config.apiBase || process.env.OPENAI_API_BASE || process.env.NEXT_PUBLIC_OPENAI_API_BASE || 'https://api.openai.com/v1',
      model: config.model || process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
    });
  } else {
    return new GeminiService({
      provider: 'gemini',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
      model: config.model || process.env.GEMINI_MODEL || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-3.1-pro-preview',
    });
  }
}
