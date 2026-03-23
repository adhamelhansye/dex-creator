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
import { useAuth } from "./useAuth";
import { loadOrderlyKey, saveOrderlyKey, getAccountId } from "../utils/orderly";
import { cleanMultisigAddress } from "../utils/multisig";
import { get } from "../utils/apiClient";

interface OrderlyKeyContextType {
  orderlyKey: Uint8Array | null;
  accountId: string | null;
  setOrderlyKey: (key: Uint8Array | null) => void;
  clearOrderlyKey: () => void;
  hasValidKey: boolean;
  isOrderlyKeyReady: boolean;
  isResolvingAccount: boolean;
}

const OrderlyKeyContext = createContext<OrderlyKeyContextType | undefined>(
  undefined
);

export { OrderlyKeyContext };

export function OrderlyKeyProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { brokerId } = useDex();
  const { isAuthenticated, token } = useAuth();
  const [orderlyKey, setOrderlyKeyState] = useState<Uint8Array | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [multisigAddress, setMultisigAddress] = useState<string | null>(null);
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [multisigChecked, setMultisigChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setMultisigAddress(null);
      setMultisigChecked(true);
      setIsResolvingAccount(false);
      return;
    }

    setIsResolvingAccount(true);
    setMultisigChecked(false);

    const fetchGraduationStatus = async () => {
      try {
        const data = await get<{
          isMultisig?: boolean;
          multisigAddress?: string;
        }>("/api/graduation/graduation-status", token, {
          showToastOnError: false,
        });
        if (data.isMultisig && data.multisigAddress) {
          setMultisigAddress(data.multisigAddress);
        } else {
          setMultisigAddress(null);
        }
      } catch {
        setMultisigAddress(null);
      } finally {
        setMultisigChecked(true);
        setIsResolvingAccount(false);
      }
    };

    fetchGraduationStatus();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isConnected) {
      setOrderlyKeyState(null);
      setAccountId(null);
      return;
    }

    if (!multisigChecked) {
      setOrderlyKeyState(null);
      setAccountId(null);
      return;
    }

    if (address && brokerId) {
      const effectiveAddress = multisigAddress
        ? cleanMultisigAddress(multisigAddress)
        : address;
      const newAccountId = getAccountId(effectiveAddress, brokerId);
      const savedKey = loadOrderlyKey(newAccountId);
      setAccountId(newAccountId);
      setOrderlyKeyState(savedKey || null);
    } else {
      setAccountId(null);
      setOrderlyKeyState(null);
    }
  }, [address, brokerId, isConnected, multisigAddress, multisigChecked]);

  const effectiveAddress = multisigAddress
    ? cleanMultisigAddress(multisigAddress)
    : address;

  const expectedAccountId =
    effectiveAddress && brokerId
      ? getAccountId(effectiveAddress, brokerId)
      : null;
  const isOrderlyKeyReady =
    !expectedAccountId || accountId === expectedAccountId;

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
        isOrderlyKeyReady,
        isResolvingAccount,
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
