import { useTranslation } from "~/i18n";
import { Button } from "../Button";
import { Card } from "../Card";
import { useDex } from "../../context/DexContext";
import { useCreateOrderlyKey } from "~/hooks/useCreateOrderlyKey";
import { cn } from "~/utils/css";
import { useAuth } from "~/context/useAuth";
import { ConnectWalletAuthGrard } from "./ConnectWalletAuthGuard";
import { useOrderlyKey } from "~/context/OrderlyKeyContext";

type OrderlyKeyAuthGrardProps = {
  children: React.ReactNode;
  className?: string;
};

export const OrderlyKeyAuthGrard = (props: OrderlyKeyAuthGrardProps) => {
  const { t } = useTranslation();
  const { brokerId } = useDex();
  const { isAuthenticated } = useAuth();
  const { isResolvingAccount } = useOrderlyKey();

  const { hasValidKey, isCreatingKey, createOrderlyKey, accountId } =
    useCreateOrderlyKey();

  const createKey = () => {
    if (!brokerId || !accountId) {
      return;
    }
    createOrderlyKey({ brokerId, accountId });
  };

  if (!isAuthenticated) {
    return <ConnectWalletAuthGrard className={props.className} />;
  }

  if (isResolvingAccount) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16",
          props.className
        )}
      >
        <div className="i-svg-spinners:pulse-rings-multiple w-8 h-8 text-primary"></div>
      </div>
    );
  }

  if (hasValidKey) {
    return props.children;
  }

  return (
    <Card
      className={cn(
        "border border-warning/20 bg-warning/5 p-4",
        props.className
      )}
    >
      <div className="flex gap-4 items-start">
        <div className="bg-warning/20 p-2 rounded-full flex-shrink-0">
          <div className="i-mdi:key text-warning w-6 h-6"></div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-warning">
            {t("orderlyKeyAuthGuard.title")}
          </h3>
          <p className="text-gray-300 mt-1 mb-4">
            {t("orderlyKeyAuthGuard.description")}
          </p>
          <Button
            onClick={createKey}
            disabled={isCreatingKey}
            className="flex items-center gap-2"
          >
            {isCreatingKey ? (
              <>
                <div className="i-svg-spinners:pulse-rings-multiple w-4 h-4"></div>
                {t("common.creatingKey")}
              </>
            ) : (
              <>
                <div className="i-mdi:key-plus w-4 h-4"></div>
                {t("orderlyKeyAuthGuard.createButton")}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
