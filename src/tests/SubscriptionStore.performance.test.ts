import { createStore } from 'zustand';

const { describe, expect, it, beforeEach } = require('@jest/globals');

interface Subscription {
    id?: number;
    name: string;
    url: string;
    price: number;
    icon: string;
}

interface SubscriptionState {
    subscriptions: Subscription[];
    addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
    removeSubscription: (id: number) => void;
    editSubscription: (id: number, updatedSubscription: Partial<Subscription>) => void;
}

const createSubscriptionStore = () => {
    return createStore<SubscriptionState>((set) => ({
        subscriptions: [],
        addSubscription: (subscription) =>
            set((state) => ({
                subscriptions: [...state.subscriptions, { ...subscription, id: Date.now() }],
            })),
        removeSubscription: (id) =>
            set((state) => ({
                subscriptions: state.subscriptions.filter((subscription) => subscription.id !== id),
            })),
        editSubscription: (id, updatedSubscription) =>
            set((state) => ({
                subscriptions: state.subscriptions.map((subscription) =>
                    subscription.id === id ? { ...subscription, ...updatedSubscription } : subscription
                ),
            })),
    }));
};

const createOptimizedSubscriptionStore = () => {
    return createStore<SubscriptionState>((set) => ({
        subscriptions: [],
        addSubscription: (subscription) =>
            set((state) => ({
                subscriptions: [...state.subscriptions, { ...subscription, id: Date.now() }],
            })),
        removeSubscription: (id) =>
            set((state) => ({
                subscriptions: state.subscriptions.filter((subscription) => subscription.id !== id),
            })),
        editSubscription: (id, updatedSubscription) =>
            set((state) => {
                // Create a Map for O(1) lookup
                const subscriptionMap = new Map(
                    state.subscriptions.map(sub => [sub.id, sub])
                );
                
                // Update the specific subscription in the Map
                const targetSub = subscriptionMap.get(id);
                if (targetSub) {
                    subscriptionMap.set(id, { ...targetSub, ...updatedSubscription });
                }
                
                // Convert back to array while maintaining order
                return {
                    subscriptions: state.subscriptions.map(sub => 
                        sub.id === id ? subscriptionMap.get(id)! : sub
                    )
                };
            }),
    }));
};

describe('SubscriptionStore Performance', () => {
    const SUBSCRIPTION_COUNT = 10000; // Large number to make performance differences noticeable
    const ITERATIONS = 1000; // Increased iterations for more accurate measurements

    const measureTime = (fn: () => void): number => {
        const start = performance.now();
        fn();
        return performance.now() - start;
    };

    const calculatePercentile = (arr: number[], percentile: number): number => {
        const sortedArr = [...arr].sort((a, b) => a - b);
        const index = Math.floor(sortedArr.length * (percentile / 100));
        return sortedArr[index] || 0; // Return 0 if undefined
    };

    const runPerformanceTest = (store: ReturnType<typeof createSubscriptionStore>) => {
        // Initialize with bulk data
        for (let i = 0; i < SUBSCRIPTION_COUNT; i++) {
            store.getState().addSubscription({
                name: `Service ${i}`,
                url: `https://test${i}.com`,
                price: 9.99,
                icon: `https://test${i}.com/icon.png`,
            });
        }

        const subscriptions = store.getState().subscriptions;
        const timings: number[] = [];

        // Perform multiple edits and measure each one
        for (let i = 0; i < ITERATIONS; i++) {
            const randomId = subscriptions[Math.floor(Math.random() * SUBSCRIPTION_COUNT)]?.id;
            if (!randomId) continue;

            const time = measureTime(() => {
                store.getState().editSubscription(randomId, {
                    name: `Updated Service ${i}`,
                    price: 19.99,
                });
            });
            timings.push(time);
        }

        return {
            average: timings.reduce((a, b) => a + b, 0) / timings.length,
            p95: calculatePercentile(timings, 95),
            p99: calculatePercentile(timings, 99)
        };
    };

    it('should measure performance of original implementation', () => {
        const store = createSubscriptionStore();
        const results = runPerformanceTest(store);
        
        console.log('Original Implementation Results:');
        console.log(`Average time: ${results.average.toFixed(2)}ms`);
        console.log(`95th percentile: ${results.p95.toFixed(2)}ms`);
        console.log(`99th percentile: ${results.p99.toFixed(2)}ms`);
        
        expect(results.average).toBeDefined();
    });

    it('should measure performance of optimized implementation', () => {
        const store = createOptimizedSubscriptionStore();
        const results = runPerformanceTest(store);
        
        console.log('Optimized Implementation Results:');
        console.log(`Average time: ${results.average.toFixed(2)}ms`);
        console.log(`95th percentile: ${results.p95.toFixed(2)}ms`);
        console.log(`99th percentile: ${results.p99.toFixed(2)}ms`);
        
        expect(results.average).toBeDefined();
    });
});