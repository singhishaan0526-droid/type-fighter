import { getRandomSentence } from '../data/sentences';

const getApiKey = (): string => {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || ''
  );
};

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// High-speed pre-buffered queue for 0ms lag transitions during fast typing
class GeminiSentenceService {
  private buffer: string[] = [];
  private aiGeneratedSet = new Set<string>();
  private isFetching = false;
  private maxBufferSize = 5;

  constructor() {
    // Warm up the buffer with fresh AI sentences immediately upon boot
    this.replenishBuffer();
  }

  /**
   * Request a fresh cyber martial arts sentence directly from Gemini API
   */
  public async generateSentenceFromGemini(category = 'combat'): Promise<string | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const themePrompts: Record<string, string> = {
      combat: 'martial arts combat, shadow ninjas, ancient weapon duels',
      cyber: 'cyberpunk hacking, neon shadows, digital warriors, energy blades',
      classic: 'swift reflexes, precision typing drills, legendary master teachings'
    };

    const theme = themePrompts[category] || themePrompts.combat;
    const prompt = `Generate a single short sentence for a competitive typing fighting game with the theme of ${theme}. Requirements: exactly 9 to 14 words, easy to type punctuation (periods or commas only), inspiring and punchy. Output ONLY the raw sentence text without quotes, markdown, or numbering.`;

    try {
      const response = await fetch(GEMINI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      // Clean and sanitize text
      let cleaned = rawText
        .trim()
        .replace(/^["'`]+|["'`]+$/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
        cleaned += '.';
      }

      if (cleaned.length >= 15 && cleaned.length <= 140) {
        this.aiGeneratedSet.add(cleaned);
        return cleaned;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Refill the pre-fetch buffer in the background
   */
  public async replenishBuffer(category = 'combat') {
    if (this.isFetching || this.buffer.length >= this.maxBufferSize) return;
    this.isFetching = true;

    try {
      while (this.buffer.length < this.maxBufferSize) {
        const sentence = await this.generateSentenceFromGemini(category);
        if (sentence && !this.buffer.includes(sentence)) {
          this.buffer.push(sentence);
        } else {
          // If Gemini rate-limits or fails, pause briefly to avoid spamming
          break;
        }
      }
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get the next sentence immediately (from Gemini queue, or fallback if empty)
   */
  public getNextSentence(excludeText?: string, category = 'combat'): string {
    // If buffer has sentences, pop the first one
    if (this.buffer.length > 0) {
      const candidate = this.buffer.shift()!;
      // Trigger background replenishment
      setTimeout(() => this.replenishBuffer(category), 100);

      if (candidate !== excludeText) {
        return candidate;
      }
    }

    // Trigger replenishment if running low
    this.replenishBuffer(category);

    // Fallback to offline curated sentences pool if queue was temporarily empty
    return getRandomSentence(excludeText);
  }

  /**
   * Asynchronously get a fresh sentence from Gemini (with queue support)
   */
  public async getNextSentenceAsync(excludeText?: string, category = 'combat'): Promise<string> {
    if (this.buffer.length > 0) {
      const candidate = this.buffer.shift()!;
      setTimeout(() => this.replenishBuffer(), 100);
      if (candidate !== excludeText) return candidate;
    }

    // Try fetching fresh directly
    const direct = await this.generateSentenceFromGemini(category);
    if (direct && direct !== excludeText) {
      return direct;
    }

    return getRandomSentence(excludeText);
  }

  public isAIGenerated(text: string): boolean {
    return this.aiGeneratedSet.has(text);
  }
}

export const geminiSentenceService = new GeminiSentenceService();
