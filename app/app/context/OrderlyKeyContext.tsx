import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useAccount } from "wagmi";
import { useDex } from "./DexContext";
import { loadOrderlyKey, saveOrderlyKey, getAccountId } from "../utils/orderly";

interface OrderlyKeyContextType {
  orderlyKey: Uint8Array | null;
  accountId: string | null;
  setOrderlyKey: (key: Uint8Array | null) => void;
  clearOrderlyKey: () => void;
  hasValidKey: boolean;
}

const OrderlyKeyContext = createContext<OrderlyKeyContextType | undefined>(
  undefined
);

export { OrderlyKeyContext };

export function OrderlyKeyProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { brokerId } = useDex();
  const [orderlyKey, setOrderlyKeyState] = useState<Uint8Array | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (address && brokerId) {
      const newAccountId = getAccountId(address, brokerId);
      setAccountId(newAccountId);
    } else {
      setAccountId(null);
    }
  }, [address, brokerId]);

  useEffect(() => {
    if (accountId) {
      const savedKey = loadOrderlyKey(accountId);
      setOrderlyKeyState(savedKey || null);
    } else {
      setOrderlyKeyState(null);
    }
  }, [accountId]);

  useEffect(() => {
    if (!isConnected) {
      setOrderlyKeyState(null);
      setAccountId(null);
    }
  }, [isConnected]);

  const setOrderlyKey = useCallback(
    (key: Uint8Array | null) => {
      setOrderlyKeyState(key);
      if (key && accountId) {
        saveOrderlyKey(accountId, key);
      }
    },
    [accountId]
  );

  const clearOrderlyKey = useCallback(() => {
    if (accountId) {
      const deploymentEnv = import.meta.env.VITE_DEPLOYMENT_ENV || "dev";
      const storageKey = `orderly-key:${accountId}:${deploymentEnv}`;
      localStorage.removeItem(storageKey);
    }
    setOrderlyKeyState(null);
  }, [accountId]);

  const hasValidKey = Boolean(orderlyKey && accountId && brokerId);

  return (
    <OrderlyKeyContext.Provider
      value={{
        orderlyKey,
        accountId,
        setOrderlyKey,
        clearOrderlyKey,
        hasValidKey,
      }}
    >
      {children}
    </OrderlyKeyContext.Provider>
  );
}

export function useOrderlyKey() {
  const context = useContext(OrderlyKeyContext);
  if (context === undefined) {
    throw new Error("useOrderlyKey must be used within an OrderlyKeyProvider");
  }
  return context;
}
