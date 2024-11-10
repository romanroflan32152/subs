import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from '~/env';

interface Subscription {
  id: number;
  name: string;
  url: string;
  price: number;
  icon: string;
}

interface SubscriptionStore {
  subscriptions: Map<number, Subscription>;
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  addSubscriptionsBatch: (subscriptions: Omit<Subscription, 'id'>[]) => void;
  removeSubscription: (id: number) => void;
  removeSubscriptionsBatch: (ids: number[]) => void;
  editSubscription: (id: number, updatedSubscription: Partial<Omit<Subscription, 'id'>>) => void;
  editSubscriptionsBatch: (updates: Array<{ id: number; subscription: Partial<Omit<Subscription, 'id'>> }>) => void;
  getAllSubscriptions: () => Subscription[];
}

const defaultSubscriptions = new Map<number, Subscription>([
  [1, {
    id: 1,
    name: 'Netflix',
    url: 'https://www.netflix.com',
    price: 15.99,
    icon: 'https://www.google.com/s2/favicons?domain=netflix.com',
  }],
  [2, {
    id: 2,
    name: 'Google One',
    url: 'https://one.google.com',
    price: 1.99,
    icon: 'https://www.google.com/s2/favicons?domain=google.com',
  }],
  [3, {
    id: 3,
    name: 'Amazon Prime',
    url: 'https://www.amazon.com/prime',
    price: 14.99,
    icon: 'https://www.google.com/s2/favicons?domain=amazon.com',
  }],
  [4, {
    id: 4,
    name: 'Spotify',
    url: 'https://www.spotify.com',
    price: 9.99,
    icon: 'https://www.google.com/s2/favicons?domain=spotify.com',
  }],
  [5, {
    id: 5,
    name: 'YouTube Premium',
    url: 'https://onlyfans.com/',
    price: 69.99,
    icon: 'https://www.google.com/s2/favicons?domain=onlyfans.com',
  }],
]);

// Helper functions for Map serialization
const serializeMap = (map: Map<number, Subscription> | Record<string, Subscription>) => {
  if (map instanceof Map) {
    return Array.from(map.entries());
  }
  // If it's an object, convert it to array of entries
  return Object.entries(map).map(([key, value]) => [Number(key), value]);
};

const deserializeMap = (entries: [string | number, Subscription][]) => {
  return new Map(entries.map(([key, value]) => [Number(key), value]));
};

const getStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }

  if (env.NEXT_PUBLIC_USE_SQLITE === 'false') {
    return {
      getItem: (key: string) => {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          const subscriptions = parsed.state.subscriptions;
          return Promise.resolve(JSON.stringify({
            ...parsed,
            state: {
              ...parsed.state,
              subscriptions: serializeMap(subscriptions)
            }
          }));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        const parsed = JSON.parse(value);
        const serialized = JSON.stringify({
          ...parsed,
          state: {
            ...parsed.state,
            subscriptions: serializeMap(parsed.state.subscriptions)
          }
        });
        localStorage.setItem(key, serialized);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      }
    };
  }

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const response = await fetch(`/api/kv/${name}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.value || Object.keys(data.value).length === 0) {
            return JSON.stringify({ subscriptions: serializeMap(defaultSubscriptions) });
          }
          return JSON.stringify({
            ...data.value,
            subscriptions: serializeMap(data.value.subscriptions)
          });
        }
        return null;
      } catch (error) {
        console.error('Error fetching from KV store:', error);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const parsed = JSON.parse(value);
        await fetch(`/api/kv/${name}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: {
              ...parsed,
              subscriptions: serializeMap(parsed.subscriptions)
            }
          }),
        });
      } catch (error) {
        console.error('Error setting item in KV store:', error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await fetch(`/api/kv/${name}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error removing item from KV store:', error);
      }
    },
  };
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      subscriptions: defaultSubscriptions,
      
      addSubscription: (newSubscription) => {
        set((state) => {
          const id = Date.now();
          const newMap = new Map(state.subscriptions);
          newMap.set(id, { ...newSubscription, id });
          return { subscriptions: newMap };
        });
      },

      addSubscriptionsBatch: (newSubscriptions) => {
        set((state) => {
          const newMap = new Map(state.subscriptions);
          const timestamp = Date.now();
          newSubscriptions.forEach((sub, index) => {
            const id = timestamp + index;
            newMap.set(id, { ...sub, id });
          });
          return { subscriptions: newMap };
        });
      },

      removeSubscription: (id) => {
        set((state) => {
          const newMap = new Map(state.subscriptions);
          newMap.delete(id);
          return { subscriptions: newMap };
        });
      },

      removeSubscriptionsBatch: (ids) => {
        set((state) => {
          const newMap = new Map(state.subscriptions);
          ids.forEach(id => newMap.delete(id));
          return { subscriptions: newMap };
        });
      },

      editSubscription: (id, updatedSubscription) => {
        set((state) => {
          const newMap = new Map(state.subscriptions);
          const existing = newMap.get(id);
          if (existing) {
            newMap.set(id, { ...existing, ...updatedSubscription });
          }
          return { subscriptions: newMap };
        });
      },

      editSubscriptionsBatch: (updates) => {
        set((state) => {
          const newMap = new Map(state.subscriptions);
          updates.forEach(({ id, subscription }) => {
            const existing = newMap.get(id);
            if (existing) {
              newMap.set(id, { ...existing, ...subscription });
            }
          });
          return { subscriptions: newMap };
        });
      },

      getAllSubscriptions: () => {
        return Array.from(get().subscriptions.values());
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(getStorage),
      skipHydration: false,
    }
  )
);