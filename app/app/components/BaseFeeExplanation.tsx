import { FC } from "react";

export const BaseFeeExplanation: FC = () => {
  return (
    <div className="bg-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
      <h3 className="text-md font-medium mb-3 flex items-center">
        <div className="i-mdi:finance text-primary w-5 h-5 mr-2"></div>
        Understanding Base Fees & Staking Tiers
      </h3>

      <div className="text-sm text-gray-300 mb-4">
        <p className="mb-3">
          <span className="font-medium text-white">Base Fee:</span> Orderly
          retains 100% of a base taker fee while offering 0 bps maker fee. This
          fee varies by tier in our Builder Staking Programme:
        </p>

        <div className="bg-background-dark/50 rounded-lg overflow-hidden mb-4">
          <div className="grid grid-cols-3 text-center border-b border-light/10">
            <div className="p-2 font-medium bg-background-dark/70">Tier</div>
            <div className="p-2 font-medium bg-background-dark/70">
              Requirement
            </div>
            <div className="p-2 font-medium bg-background-dark/70">
              Base Fee
            </div>
          </div>

          <div className="grid grid-cols-3 text-center border-b border-light/10">
            <div className="p-2 flex flex-col justify-center">
              <span className="font-medium">Public</span>
              <span className="text-xs text-gray-400">Default</span>
            </div>
            <div className="p-2">None</div>
            <div className="p-2">3.00 bps taker</div>
          </div>

          <div className="grid grid-cols-3 text-center border-b border-light/10">
            <div className="p-2 flex flex-col justify-center">
              <span className="font-medium text-gray-100">Silver</span>
              <span className="text-xs text-gray-400">Intermediate</span>
            </div>
            <div className="p-2 text-xs">
              ≥100,000 ORDER
              <br />
              <span className="text-gray-400">OR</span>
              <br />
              30m monthly volume
            </div>
            <div className="p-2">2.75 bps taker</div>
          </div>

          <div className="grid grid-cols-3 text-center">
            <div className="p-2 flex flex-col justify-center">
              <span className="font-medium text-warning">Gold</span>
              <span className="text-xs text-gray-400">Premium</span>
            </div>
            <div className="p-2 text-xs">
              ≥250,000 ORDER
              <br />
              <span className="text-gray-400">OR</span>
              <br />
              90m monthly volume
            </div>
            <div className="p-2">2.50 bps taker</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <p className="font-medium text-white">What does this mean for you?</p>
          <a
            href="https://orderly.network/docs/build-on-omnichain/user-flows/builder-staking-programme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light hover:underline text-xs flex items-center"
          >
            View documentation
            <span className="i-mdi:open-in-new w-3 h-3 ml-1"></span>
          </a>
        </div>

        <p className="mb-3">
          Your custom fee settings represent the total fees that traders pay.
          Your revenue is calculated by subtracting the base fee from your
          custom fees:
        </p>

        <ul className="pl-5 list-disc space-y-1 mb-3">
          <li>
            Base Fee (retained by Orderly): Currently 3.00 bps taker for Public
            tier - this is deducted from your custom fees
          </li>
          <li>Your Revenue: Your Custom Fee - Base Fee</li>
        </ul>

        <div className="flex items-center gap-2">
          <span className="i-mdi:lightbulb text-warning w-4 h-4 flex-shrink-0"></span>
          <span>
            By staking more ORDER tokens or achieving higher trading volume, you
            can reduce the base fee charged by Orderly, maximizing your DEX's
            competitiveness.
          </span>
        </div>

        <div className="mt-4 flex justify-center">
          <a
            href="https://app.orderly.network/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary-light transition-colors px-4 py-2 rounded-full text-white font-medium flex items-center gap-2"
          >
            <span className="i-mdi:trending-up w-4 h-4"></span>
            Stake ORDER for Better Rates
            <span className="i-mdi:open-in-new w-3.5 h-3.5"></span>
          </a>
        </div>

        <div className="mt-4 bg-warning/10 p-3 rounded-lg">
          <div className="flex items-start gap-2 text-sm">
            <div className="i-mdi:alert-circle text-warning w-5 h-5 flex-shrink-0"></div>
            <p>
              <span className="font-medium text-warning">Important:</span> You
              must use the{" "}
              <span className="font-medium">exact same wallet</span> for staking
              ORDER tokens that you used to set up this DEX. This ensures proper
              tier attribution and benefits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
