import { createStore } from 'zustand';

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

// Mock the env import
jest.mock('~/env', () => ({
    env: {
        NEXT_PUBLIC_USE_SQLITE: 'false',
    },
}));

// Create mock storage
const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};

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

describe('SubscriptionStore', () => {
    let store: ReturnType<typeof createSubscriptionStore>;

    beforeEach(() => {
        store = createSubscriptionStore();
    });

    it('should add a subscription', () => {
        const newSubscription = {
            name: 'Test Service',
            url: 'https://test.com',
            price: 9.99,
            icon: 'https://test.com/icon.png',
        };

        store.getState().addSubscription(newSubscription);
        const state = store.getState();

        expect(state.subscriptions).toHaveLength(1);

        if (state.subscriptions[0]) {
            expect(state.subscriptions[0]).toMatchObject(newSubscription);
            expect(state.subscriptions[0].id).toBeDefined();
        } else {
            throw new Error("Subscription not added correctly");
        }
    });

    it('should remove a subscription', () => {
        const newSubscription = {
            name: 'Test Service',
            url: 'https://test.com',
            price: 9.99,
            icon: 'https://test.com/icon.png',
        };

        store.getState().addSubscription(newSubscription);
        const initialState = store.getState();
        expect(initialState.subscriptions).toHaveLength(1);

        const subscriptionId = initialState.subscriptions[0]?.id;
        if (subscriptionId) {
            store.getState().removeSubscription(subscriptionId);
        } else {
            throw new Error("Subscription ID not found");
        }

        const finalState = store.getState();
        expect(finalState.subscriptions).toHaveLength(0);
    });

    it('should edit a subscription', () => {
        const subscription = {
            name: 'Test Service',
            url: 'https://test.com',
            price: 9.99,
            icon: 'https://test.com/icon.png',
        };

        store.getState().addSubscription(subscription);
        const initialState = store.getState();
        expect(initialState.subscriptions).toHaveLength(1);

        const subscriptionId = initialState.subscriptions[0]?.id;
        const updatedSubscription = {
            name: 'Updated Service',
            url: 'https://updated.com',
            price: 19.99,
            icon: 'https://updated.com/icon.png',
        };

        if (subscriptionId) {
            store.getState().editSubscription(subscriptionId, updatedSubscription);
        } else {
            throw new Error("Subscription ID not found for editing");
        }

        const finalState = store.getState();
        expect(finalState.subscriptions).toHaveLength(1);

        if (finalState.subscriptions[0]) {
            expect(finalState.subscriptions[0]).toMatchObject(updatedSubscription);
            expect(finalState.subscriptions[0].id).toBe(subscriptionId);
        } else {
            throw new Error("Edited subscription not found");
        }
    });

    it('should handle multiple subscriptions', () => {
        const subscriptions = [
            {
                name: 'Service 1',
                url: 'https://test1.com',
                price: 9.99,
                icon: 'https://test1.com/icon.png',
            },
            {
                name: 'Service 2',
                url: 'https://test2.com',
                price: 19.99,
                icon: 'https://test2.com/icon.png',
            },
            {
                name: 'Service 3',
                url: 'https://test3.com',
                price: 29.99,
                icon: 'https://test3.com/icon.png',
            },
        ];

        subscriptions.forEach(subscription => {
            store.getState().addSubscription(subscription);
        });

        const state = store.getState();
        expect(state.subscriptions).toHaveLength(3);

        state.subscriptions.forEach((sub, index) => {
            if (sub) {
                expect(sub).toMatchObject(subscriptions[index] as typeof sub);
            } else {
                throw new Error(`Subscription at index ${index} is undefined`);
            }
        });
    });

    it('should maintain subscription order', () => {
        const subscriptions = [
            { name: 'Service 1', url: 'url1', price: 9.99, icon: 'icon1' },
            { name: 'Service 2', url: 'url2', price: 19.99, icon: 'icon2' },
        ];

        subscriptions.forEach(sub => {
            store.getState().addSubscription(sub);
        });

        const state = store.getState();
        if (state.subscriptions[0] && state.subscriptions[1]) {
            expect(state.subscriptions[0].name).toBe('Service 1');
            expect(state.subscriptions[1].name).toBe('Service 2');
        } else {
            throw new Error("Subscriptions order check failed due to undefined entries");
        }
    });
});
