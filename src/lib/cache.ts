interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  private constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }
}

export const cache = CacheManager.getInstance();
