import { useCreateOrderlyKey } from "../../hooks/useCreateOrderlyKey";
import { SuccessStepCard } from "./components/SuccessStepCard";
import { OrderlyKeyCard } from "./components/OrderlyKeyCard";
import { DistributorNameCard } from "./components/DistributorNameCard";
import { DistributorHeader } from "./components/DistributorHeader";

type CompleteDistributorProfileProps = {
  accountId: string;
  brokerId: string;
  onSuccess: () => void;
};

export function CompleteAmbassadorProfile(
  props: CompleteDistributorProfileProps
) {
  const { hasValidKey } = useCreateOrderlyKey();

  return (
    <div className="mt-15 md:mt-30 pb-52 font-medium">
      <div className="section-container flex flex-col gap-10 md:gap-16 items-start px-4 md:px-8 py-10 md:py-16 relative max-w-6xl mx-auto">
        {/* Header Section */}
        <DistributorHeader title="Complete your distributor profile - 3 steps" />

        {/* Main Content */}
        <div className="flex flex-col gap-5 items-start w-full">
          {/* Step 1 */}
          <SuccessStepCard
            title="What describes you best?"
            value="Ambassador"
          />

          {/* Step 2 */}
          <OrderlyKeyCard
            brokerId={props.brokerId}
            accountId={props.accountId}
          />

          {/* Step 3 */}
          {hasValidKey && <DistributorNameCard onSuccess={props.onSuccess} />}
        </div>
      </div>
    </div>
  );
}
