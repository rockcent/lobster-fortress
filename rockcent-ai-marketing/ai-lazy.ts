// Lazy AI services - defers @google/genai (256KB) loading until first AI interaction
// Usage: const ai = await getAIServices(); then ai.extractMarketingNeeds(...)

// 使用火山方舟后端代理
let _cached: typeof import('./ai-ark') | null = null;

export async function getAIServices() {
  if (!_cached) {
    _cached = await import('./ai-ark');
  }
  return _cached;
}
