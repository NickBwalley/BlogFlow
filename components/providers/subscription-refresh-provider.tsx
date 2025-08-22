"use client";

import { createContext, useContext, useState } from "react";

interface SubscriptionRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const SubscriptionRefreshContext = createContext<
  SubscriptionRefreshContextType | undefined
>(undefined);

export function SubscriptionRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <SubscriptionRefreshContext.Provider
      value={{ refreshTrigger, triggerRefresh }}
    >
      {children}
    </SubscriptionRefreshContext.Provider>
  );
}

export function useSubscriptionRefresh() {
  const context = useContext(SubscriptionRefreshContext);
  if (context === undefined) {
    throw new Error(
      "useSubscriptionRefresh must be used within a SubscriptionRefreshProvider"
    );
  }
  return context;
}
