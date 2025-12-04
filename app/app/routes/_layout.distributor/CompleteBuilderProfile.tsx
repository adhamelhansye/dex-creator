import { SuccessStepCard } from "./components/SuccessStepCard";
import { OrderlyKeyCard } from "./components/OrderlyKeyCard";
import { DexCreationCard } from "./components/DexCreationCard";
import { useDex } from "../../context/DexContext";
import { DexGraduationCard } from "./components/DexGraduationCard";
import { DistributorHeader } from "./components/DistributorHeader";

export function CompleteBuilderProfile() {
  const { dexData } = useDex();

  return (
    <div className="mt-15 md:mt-30 pb-52 font-medium">
      <div className="section-container flex flex-col gap-10 md:gap-16 items-start px-4 md:px-8 py-10 md:py-16 relative max-w-6xl mx-auto">
        {/* Header Section */}
        <DistributorHeader title="Complete your distributor profile - 4 steps" />

        {/* Main Content */}
        <div className="flex flex-col gap-5 w-full">
          {/* Step 1 */}
          <SuccessStepCard title="What describes you best?" value="Builder" />

          {/* Step 2 */}
          <DexCreationCard />

          {/* Step 3 */}
          <DexGraduationCard />

          {/* Step 4 */}
          {dexData && dexData.isGraduated && <OrderlyKeyCard />}
        </div>
      </div>
    </div>
  );
}
