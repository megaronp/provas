import NodeCache from 'node-cache';

export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export interface CacheOptions {
  ttl?: number;
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }

  console.log(`[CACHE MISS] ${key}`);
  const data = await fetcher();
  cache.set(key, data, options.ttl ?? 0);
  return data;
}

export function invalidate(key: string): void {
  cache.del(key);
  console.log(`[CACHE INVALIDATE] ${key}`);
}

export function invalidatePattern(pattern: RegExp): void {
  const keys = cache.keys();
  let count = 0;
  keys.forEach(k => {
    if (pattern.test(k)) {
      cache.del(k);
      count++;
    }
  });
  if (count > 0) console.log(`[CACHE INVALIDATE] ${count} keys matching ${pattern}`);
}

export function getCachedSync<T>(key: string, fetcher: () => T, options: CacheOptions = {}): T {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }

  console.log(`[CACHE MISS] ${key}`);
  const data = fetcher();
  cache.set(key, data, options.ttl ?? 0);
  return data;
}