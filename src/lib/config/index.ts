// ===========================================
// Unified Configuration Module
// ===========================================

export type AIProviderType = 'ollama' | 'openai';

// -------------------------------------------
// AI Provider Configuration
// -------------------------------------------
export const aiConfig = {
  provider: (process.env.AI_PROVIDER || 'ollama') as AIProviderType,
  fallbackEnabled: process.env.AI_FALLBACK_ENABLED === 'true',
};

// -------------------------------------------
// Ollama Configuration
// -------------------------------------------
export const ollamaConfig = {
  url: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000'),
};

// -------------------------------------------
// OpenAI Configuration
// -------------------------------------------
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
};

// -------------------------------------------
// Reddit API Configuration
// -------------------------------------------
export const redditConfig = {
  clientId: process.env.REDDIT_CLIENT_ID || '',
  clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
  username: process.env.REDDIT_USERNAME || '',
  password: process.env.REDDIT_PASSWORD || '',
  userAgent: process.env.REDDIT_USER_AGENT || 'find-idea:1.0',
};

// -------------------------------------------
// AI Prompts (Shared across providers)
// -------------------------------------------
export const PROMPTS = {
  summary: (channel: string, title: string, content: string) => `You are analyzing a post from ${channel} about potential product ideas or problems.

Post Title: ${title}
Post Content: ${content}

Provide a concise 1-2 sentence summary in Korean focusing on:
- The core problem or need being expressed
- Any mentioned pain points or frustrations
- Potential market opportunity

Guidelines:
- Keep it under 100 characters
- Focus on actionable insights
- Use natural Korean

Summary:`,

  keywords: (content: string) => `Extract 3-5 key topics/keywords from this post.
Focus on: problems, tools, industries, user types, and pain points.

Post: ${content}

Return ONLY a JSON array of keywords in English.
Example: ["automation", "small business", "invoicing", "time tracking"]

Keywords:`,

  potential: (content: string) => `Rate this post's potential as a product idea from 1-10.

Scoring criteria:
- Problem clarity (is the problem well-defined?)
- Market size hints (how many people might have this problem?)
- Willingness to pay signals (mentions of budget, current spending, desperation)
- Solution gap (are existing solutions inadequate?)

Post: ${content}

Respond ONLY in JSON format:
{"score": N, "reason": "brief explanation in Korean (max 50 chars)"}

Response:`,
};

// -------------------------------------------
// Validation Helpers
// -------------------------------------------
export function isRedditConfigured(): boolean {
  return !!(
    redditConfig.clientId &&
    redditConfig.clientSecret &&
    redditConfig.username &&
    redditConfig.password
  );
}

export function isOpenAIConfigured(): boolean {
  return !!openaiConfig.apiKey && openaiConfig.apiKey.startsWith('sk-');
}

export function isOllamaConfigured(): boolean {
  return !!ollamaConfig.url;
}
