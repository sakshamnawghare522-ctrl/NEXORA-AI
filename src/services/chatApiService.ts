import { ChatApiStreamPayload } from '../types/chat.ts';

export class ChatApiService {
  /**
   * Streams a response from /api/chat using SSE.
   * Calls onToken with each received chunk of text.
   * Returns a promise that resolves with the complete generated text.
   */
  static async streamChat(
    payload: ChatApiStreamPayload,
    onToken: (token: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.error) {
          errorMsg = errJson.error;
        }
      } catch {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          return fullText;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            fullText += parsed.text;
            onToken(parsed.text);
          }
        } catch {
          // non-JSON SSE ping or text
        }
      }
    }

    return fullText;
  }
}
