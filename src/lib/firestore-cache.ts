// Sistema de cache para otimizar queries do Firestore

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class FirestoreCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

  // Gerar chave única para a query
  generateKey(collection: string, queryParams?: Record<string, any>): string {
    const params = queryParams ? JSON.stringify(queryParams) : '';
    return `${collection}_${params}`;
  }

  // Verificar se item do cache é válido
  isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Obter item do cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || !this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  // Armazenar no cache
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  // Invalidar cache por padrão
  invalidate(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Limpar cache expirado
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear();
  }

  // Obter estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instância global do cache
export const firestoreCache = new FirestoreCache();

// Configurar limpeza automática do cache
if (typeof window !== 'undefined') {
  setInterval(() => {
    firestoreCache.cleanup();
  }, 10 * 60 * 1000); // Limpar a cada 10 minutos
}

// Utilitários para otimização de queries
export class QueryOptimizer {
  // Batching de queries - agrupa múltiplas queries
  static async batchQueries<T>(
    queries: (() => Promise<T>)[]
  ): Promise<T[]> {
    try {
      const results = await Promise.all(queries.map(query => query()));
      return results;
    } catch (error) {
      console.error('Erro no batch de queries:', error);
      throw error;
    }
  }

  // Debounce para queries frequentes
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle para limitar frequência de queries
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Paginação eficiente
  static createPaginator<T>(
    query: any,
    pageSize: number = 10
  ) {
    let lastDoc: any = null;
    let hasMore = true;

    return {
      async getNextPage(): Promise<{ data: T[]; hasMore: boolean }> {
        if (!hasMore) return { data: [], hasMore: false };

        let paginatedQuery = query.limit(pageSize + 1);
        if (lastDoc) {
          paginatedQuery = paginatedQuery.startAfter(lastDoc);
        }

        const snapshot = await paginatedQuery.get();
        const docs = snapshot.docs;

        hasMore = docs.length > pageSize;
        if (hasMore) {
          docs.pop(); // Remove o documento extra usado para verificar hasMore
        }

        if (docs.length > 0) {
          lastDoc = docs[docs.length - 1];
        }

        const data = docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as T[];
        return { data, hasMore };
      },

      reset() {
        lastDoc = null;
        hasMore = true;
      }
    };
  }
}

// Hook para usar cache com React
export function useFirestoreCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    enabled?: boolean;
    onError?: (error: any) => void;
  }
) {
  const { ttl, enabled = true, onError } = options || {};

  const getCachedData = async (): Promise<T> => {
    if (!enabled) {
      return await fetcher();
    }

    // Tentar obter do cache primeiro
    const cached = firestoreCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Se não estiver no cache, buscar e armazenar
    try {
      const data = await fetcher();
      firestoreCache.set(key, data, ttl);
      return data;
    } catch (error) {
      onError?.(error);
      throw error;
    }
  };

  return {
    fetch: getCachedData,
    invalidate: () => firestoreCache.invalidate(key),
    clearCache: () => firestoreCache.clear(),
  };
}

// Estratégias de cache pré-definidas
export const CacheStrategies = {
  // Cache de longa duração para dados estáticos
  STATIC: 24 * 60 * 60 * 1000, // 24 horas
  
  // Cache médio para dados que mudam ocasionalmente
  MEDIUM: 60 * 60 * 1000, // 1 hora
  
  // Cache curto para dados dinâmicos
  SHORT: 5 * 60 * 1000, // 5 minutos
  
  // Cache muito curto para dados em tempo real
  REALTIME: 30 * 1000, // 30 segundos
};
