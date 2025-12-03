import { Button } from "../../../components/Button";
import { useCreateOrderlyKey } from "../../../hooks/useCreateOrderlyKey";
import { StepCard } from "./StepCard";
import { SuccessStepCard } from "./SuccessStepCard";

type OrderlyKeyCardProps = {
  brokerId: string;
  accountId: string;
};

export const OrderlyKeyCard = (props: OrderlyKeyCardProps) => {
  const { hasValidKey, isCreatingKey, createOrderlyKey } =
    useCreateOrderlyKey();

  const createKey = () => {
    createOrderlyKey({
      brokerId: props.brokerId,
      accountId: props.accountId,
    }).then(res => {});
  };

  if (hasValidKey) {
    return <SuccessStepCard title="Orderly key" />;
  }

  return (
    <StepCard
      title="Orderly key"
      description="This key provides secure access to the Orderly Network API. It will be stored locally to manage your distributor profile. A wallet signature is required to create this key."
      action={
        <Button
          variant="primary"
          size="md"
          onClick={createKey}
          disabled={isCreatingKey}
          isLoading={isCreatingKey}
          className="shrink-0"
        >
          Create key
        </Button>
      }
    />
  );
};
