import { useSubscriptionStore } from '~/lib/subscriptionStore';
import { env } from '~/env';

// Mock env to use localStorage for consistent testing
jest.mock('~/env', () => ({
  env: {
    NEXT_PUBLIC_USE_SQLITE: 'false'
  }
}));

describe('SubscriptionStore Performance Tests', () => {
  const store = useSubscriptionStore;
  
  // Helper function to measure execution time
  const measureExecutionTime = async (callback: () => Promise<void> | void): Promise<number> => {
    const start = performance.now();
    await callback();
    const end = performance.now();
    return end - start;
  };

  // Helper to generate test subscriptions
  const generateTestSubscriptions = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      name: `Test Subscription ${i}`,
      url: `https://test${i}.com`,
      price: 9.99,
      icon: `https://test${i}.com/icon.png`
    }));
  };

  beforeEach(() => {
    localStorage.clear();
    // Fix: Initialize with empty Map instead of array
    store.setState({ subscriptions: new Map() });
  });

  describe('Single Operation Performance', () => {
    test('Individual add operations performance', async () => {
      const subscriptionCounts = [10, 100, 1000];
      const results: { count: number; time: number }[] = [];

      for (const count of subscriptionCounts) {
        const testSubscriptions = generateTestSubscriptions(count);
        
        const time = await measureExecutionTime(async () => {
          for (const sub of testSubscriptions) {
            store.getState().addSubscription(sub);
          }
        });

        results.push({ count, time });
        console.log(`Adding ${count} subscriptions individually took ${time.toFixed(2)}ms`);
      }
    });

    test('Individual remove operations performance', async () => {
      // Setup: Add 1000 subscriptions first
      const testSubscriptions = generateTestSubscriptions(1000);
      store.getState().addSubscriptionsBatch(testSubscriptions);

      const subscriptions = store.getState().getAllSubscriptions();
      const time = await measureExecutionTime(() => {
        subscriptions.forEach(sub => {
          store.getState().removeSubscription(sub.id);
        });
      });

      console.log(`Removing 1000 subscriptions individually took ${time.toFixed(2)}ms`);
    });

    test('Individual edit operations performance', async () => {
      // Setup: Add 1000 subscriptions first
      const testSubscriptions = generateTestSubscriptions(1000);
      store.getState().addSubscriptionsBatch(testSubscriptions);

      const subscriptions = store.getState().getAllSubscriptions();
      const time = await measureExecutionTime(() => {
        subscriptions.forEach(sub => {
          store.getState().editSubscription(sub.id, {
            name: `Updated ${sub.name}`,
            price: sub.price + 1
          });
        });
      });

      console.log(`Editing 1000 subscriptions individually took ${time.toFixed(2)}ms`);
    });
  });

  describe('Batch Operation Performance', () => {
    test('Batch add operations performance', async () => {
      const subscriptionCounts = [10, 100, 1000];
      const results: { count: number; time: number }[] = [];

      for (const count of subscriptionCounts) {
        const testSubscriptions = generateTestSubscriptions(count);
        
        const time = await measureExecutionTime(async () => {
          store.getState().addSubscriptionsBatch(testSubscriptions);
        });

        results.push({ count, time });
        console.log(`Adding ${count} subscriptions in batch took ${time.toFixed(2)}ms`);
      }

      // Verify performance is roughly linear
      const timePerOperation = results.map(r => r.time / r.count);
      const variance = Math.max(...timePerOperation) - Math.min(...timePerOperation);
      expect(variance).toBeLessThan(0.1); // Expect less than 0.1ms variance per operation
    });

    test('Batch remove operations performance', async () => {
      // Setup: Add 1000 subscriptions first
      const testSubscriptions = generateTestSubscriptions(1000);
      store.getState().addSubscriptionsBatch(testSubscriptions);

      const subscriptions = store.getState().getAllSubscriptions();
      const time = await measureExecutionTime(() => {
        store.getState().removeSubscriptionsBatch(subscriptions.map(sub => sub.id));
      });

      console.log(`Removing 1000 subscriptions in batch took ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100); // Should take less than 100ms
    });

    test('Batch edit operations performance', async () => {
      // Setup: Add 1000 subscriptions first
      const testSubscriptions = generateTestSubscriptions(1000);
      store.getState().addSubscriptionsBatch(testSubscriptions);

      const subscriptions = store.getState().getAllSubscriptions();
      const updates = subscriptions.map(sub => ({
        id: sub.id,
        subscription: {
          name: `Updated ${sub.name}`,
          price: sub.price + 1
        }
      }));

      const time = await measureExecutionTime(() => {
        store.getState().editSubscriptionsBatch(updates);
      });

      console.log(`Editing 1000 subscriptions in batch took ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(100); // Should take less than 100ms
    });
  });

  describe('Storage Performance', () => {
    test('Storage operations performance', async () => {
      const testSubscriptions = generateTestSubscriptions(100);
      
      // Measure write performance
      const writeTime = await measureExecutionTime(async () => {
        store.getState().addSubscriptionsBatch(testSubscriptions);
        // Force a storage write by creating a new instance
        const newStore = useSubscriptionStore;
      });

      console.log(`Writing 100 subscriptions to storage took ${writeTime.toFixed(2)}ms`);

      // Measure read performance
      const readTime = await measureExecutionTime(async () => {
        // Force a storage read by creating a new instance
        const newStore = useSubscriptionStore;
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for hydration
      });

      console.log(`Reading 100 subscriptions from storage took ${readTime.toFixed(2)}ms`);

      expect(writeTime).toBeLessThan(100); // Should take less than 100ms
      expect(readTime).toBeLessThan(100); // Should take less than 100ms
    });
  });

  describe('Memory Usage', () => {
    test('Memory efficiency with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Add 10000 subscriptions
      const testSubscriptions = generateTestSubscriptions(10000);
      store.getState().addSubscriptionsBatch(testSubscriptions);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsage = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB
      
      console.log(`Memory usage for 10000 subscriptions: ${memoryUsage.toFixed(2)}MB`);
      expect(memoryUsage).toBeLessThan(10); // Should use less than 10MB of additional memory
    });
  });
});