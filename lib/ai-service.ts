// Client-side AI Service Wrapper
// Calls the secure Next.js API routes instead of exposing API keys

export interface AIConfig {
  provider?: 'openai' | 'gemini';
  apiKey?: string;
  apiBase?: string;
  model?: string;
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

class ClientAIService {
  async generateContent(options: GenerateContentOptions): Promise<{ text: string }> {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${errorText}`);
    }

    return response.json();
  }

  createChat(options: ChatOptions) {
    // Keep a local copy of history for the client session
    const history = options.history ? [...options.history] : [];
    
    return {
      async sendMessage({ message }: { message: string }): Promise<{ text: string }> {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            history,
            systemInstruction: options.systemInstruction,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${errorText}`);
        }

        const responseText = await response.text();
        if (!responseText) {
          throw new Error('API returned an empty response.');
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse API response:', responseText);
          throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 100)}...`);
        }
        
        // Update local history
        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: data.text });
        
        return data;
      }
    };
  }
}

// Factory function to create AI service on the client
export function createAIService(config: Partial<AIConfig> = {}): any {
  return new ClientAIService();
}

