export type RootStackParamList = {
  Tabs: undefined;
  SubscriptionForm: { subscriptionId?: string } | undefined;
  SubscriptionDetail: { subscriptionId: string };
  Paywall: undefined;
  Recap: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Subscriptions: undefined;
  Settings: undefined;
};
