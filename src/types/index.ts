export interface Subscription {
  id: number;
  name: string;
  url: string;
  price: number;
  icon: string;
}

export interface SubscriptionStore {
  subscriptions: Subscription[];
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  removeSubscription: (id: number) => void;
  editSubscription: (id: number, updatedSubscription: Partial<Omit<Subscription, 'id'>>) => void;
}