import { useState } from "react";
import { useOrderlyKey } from "../context/OrderlyKeyContext";
import { toast } from "react-toastify";
import { useModal } from "../context/ModalContext";

export function useCreateOrderlyKey() {
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const { openModal } = useModal();

  const { orderlyKey, hasValidKey, setOrderlyKey } = useOrderlyKey();

  const createOrderlyKey = async ({
    brokerId,
    accountId,
  }: {
    brokerId: string;
    accountId: string;
  }) => {
    setIsCreatingKey(true);

    try {
      openModal("orderlyKeyLogin", {
        onSuccess: (newKey: Uint8Array) => {
          setOrderlyKey(newKey);
          toast.success("Orderly key created successfully!");
        },
        onCancel: () => {
          setIsCreatingKey(false);
        },
        brokerId,
        accountId,
      });
    } catch (error) {
      console.error("Failed to create orderly key:", error);
      toast.error("Failed to create orderly key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  return { orderlyKey, hasValidKey, isCreatingKey, createOrderlyKey };
}
