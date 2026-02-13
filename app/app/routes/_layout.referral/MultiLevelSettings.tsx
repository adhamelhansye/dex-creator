import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import type { MultiLevelReferralInfo } from "~/utils/orderly";
import { updateMultiLevelReferralConfig } from "~/utils/orderly";

interface MultiLevelSettingsProps {
  onUpgradeClick: () => void;
  isMultiLevelEnabled: boolean;
  multiLevelInfo: MultiLevelReferralInfo | null;
  isLoading: boolean;
  accountId?: string | null;
  orderlyKey?: Uint8Array | null;
  onSaved?: () => Promise<void> | void;
}

const WarningIcon = () => (
  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.33333 0C3.73083 0 0 3.73083 0 8.33333C0 12.9358 3.73083 16.6667 8.33333 16.6667C12.9358 16.6667 16.6667 12.9358 16.6667 8.33333C16.6667 3.73083 12.9358 0 8.33333 0ZM8.33333 4.16667C8.79333 4.16667 9.16667 4.54 9.16667 5V9.16667C9.16667 9.62667 8.79333 10 8.33333 10C7.87333 10 7.5 9.62667 7.5 9.16667V5C7.5 4.54 7.87333 4.16667 8.33333 4.16667ZM8.33333 10.8333C8.79333 10.8333 9.16667 11.2067 9.16667 11.6667C9.16667 12.1267 8.79333 12.5 8.33333 12.5C7.87333 12.5 7.5 12.1267 7.5 11.6667C7.5 11.2067 7.87333 10.8333 8.33333 10.8333Z"
        fill="#D9AB52"
      />
    </svg>
  </span>
);

export default function MultiLevelSettings({
  onUpgradeClick,
  isMultiLevelEnabled,
  multiLevelInfo,
  isLoading,
  accountId,
  orderlyKey,
  onSaved,
}: MultiLevelSettingsProps) {
  const [requiredVolume, setRequiredVolume] = useState<string>("0");
  const [defaultCommissionRate, setDefaultCommissionRate] =
    useState<string>("0");
  const [isSaving, setIsSaving] = useState(false);
  const [initialRequiredVolume, setInitialRequiredVolume] =
    useState<string>("0");
  const [initialDefaultCommissionRate, setInitialDefaultCommissionRate] =
    useState<string>("0");

  useEffect(() => {
    if (multiLevelInfo) {
      const volume = multiLevelInfo.required_volume?.toString() ?? "0";
      const commissionRate =
        multiLevelInfo.max_rebate_rate != null &&
        multiLevelInfo.max_rebate_rate > 0
          ? (multiLevelInfo.max_rebate_rate * 100).toString()
          : "0";

      setRequiredVolume(volume);
      setDefaultCommissionRate(commissionRate);
      setInitialRequiredVolume(volume);
      setInitialDefaultCommissionRate(commissionRate);
    }
  }, [multiLevelInfo]);

  const handleSaveSettings = async () => {
    if (!accountId || !orderlyKey) {
      toast.error("Orderly key required to update settings");
      return;
    }

    const parsedVolume = Number(requiredVolume);
    const volume = Math.floor(parsedVolume);
    if (Number.isNaN(parsedVolume) || volume < 0) {
      toast.error("Please enter a valid minimum trading volume");
      return;
    }

    const commissionPercent = Number(defaultCommissionRate);
    if (Number.isNaN(commissionPercent) || commissionPercent < 0) {
      toast.error("Please enter a valid commission rate");
      return;
    }

    if (commissionPercent > 100) {
      toast.error("Commission rate cannot exceed 100%");
      return;
    }

    const defaultRebateRate = commissionPercent / 100;

    setIsSaving(true);
    try {
      await updateMultiLevelReferralConfig(accountId, orderlyKey, {
        required_volume: volume,
        default_rebate_rate: defaultRebateRate,
      });

      toast.success("Referral settings updated successfully");

      // Update initial values after successful save
      setInitialRequiredVolume(requiredVolume);
      setInitialDefaultCommissionRate(defaultCommissionRate);

      await onSaved?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save multi-level settings";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const commissionPercentNumber = Number(defaultCommissionRate) || 0;
  const directBonusPercent =
    (multiLevelInfo?.direct_bonus_rebate_rate ?? 0) * 100;
  const remainingPercent = Math.max(
    0,
    100 - commissionPercentNumber - directBonusPercent
  );

  // Check if values have changed
  const hasChanges =
    requiredVolume !== initialRequiredVolume ||
    defaultCommissionRate !== initialDefaultCommissionRate;

  if (isMultiLevelEnabled && multiLevelInfo) {
    return (
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-[4px] rounded-[8px] p-3 bg-[#D9AB52]/20">
          <WarningIcon />
          <span className="flex-1 text-[12px] font-medium leading-[15px] tracking-[0.36px] text-[#D9AB52]">
            To protect existing users, you can only increase the default
            commission rate once referral codes are generated.
          </span>
        </div>

        <Card className="bg-[#161726] border border-[1px] border-[#FFFFFF]/[0.12] !p-8">
          <div className="flex flex-col gap-8">
            {/* Minimum trading volume input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium leading-[18px] tracking-[0.36px] text-base-contrast-54">
                Minimum trading volume (USDC)
              </label>
              <div className="bg-[#2b2638] rounded-[6px] px-3 py-2.5">
                <input
                  type="text"
                  value={requiredVolume}
                  onChange={e => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    setRequiredVolume(digits);
                  }}
                  onBlur={() => {
                    if (requiredVolume === "") {
                      setRequiredVolume("0");
                    }
                  }}
                  className="w-full bg-transparent text-sm font-medium leading-5 tracking-[0.42px] text-base-contrast outline-none placeholder:text-base-contrast-36"
                  autoComplete="off"
                  inputMode="numeric"
                />
              </div>
              <div className="flex gap-1 items-center pl-1">
                <div className="size-1 rounded-full bg-base-contrast-54 shrink-0 self-center" />
                <p className="flex-1 text-xs font-medium leading-[18px] tracking-[0.36px] text-base-contrast-54">
                  Users must meet this volume requirement to generate referral
                  codes. Set to 0 to allow all users.
                </p>
              </div>
            </div>

            {/* Default commission rate input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium leading-[18px] tracking-[0.36px] text-base-contrast-54">
                Default commission rate
              </label>
              <div className="bg-[#2b2638] rounded-[6px] px-3 py-2.5">
                <input
                  type="text"
                  value={defaultCommissionRate}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setDefaultCommissionRate(value);
                  }}
                  onBlur={() => {
                    if (defaultCommissionRate.trim() === "") {
                      setDefaultCommissionRate("0");
                    }
                  }}
                  className="w-full bg-transparent text-sm font-medium leading-5 tracking-[0.42px] text-base-contrast outline-none placeholder:text-base-contrast-36"
                  autoComplete="off"
                  inputMode="decimal"
                />
              </div>
              <div className="flex gap-1 items-center pl-1">
                <div className="size-1 rounded-full bg-base-contrast-54 shrink-0 self-center" />
                <p className="flex-1 text-xs font-medium leading-[18px] tracking-[0.36px] text-base-contrast-54">
                  Sets the base commission percentage for Level 1 affiliates. A{" "}
                  {directBonusPercent}% fixed bonus is also paid to the direct
                  referrer. Based on this setting, you will retain{" "}
                  {remainingPercent}%.
                </p>
              </div>
            </div>

            {/* Save Settings button */}
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                isLoading={isSaving}
                loadingText="Saving..."
                disabled={!hasChanges}
                className="text-[16px] leading-[120%] font-medium"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 如果未启用，显示升级按钮
  return (
    <Card className="bg-[#161726] border border-[1px] border-[#FFFFFF]/[0.12]">
      <div className="flex flex-col gap-4">
        <h2 className="text-[18px] font-medium leading-[120%] text-white/98">
          Upgrade to Multi-Level Referral
        </h2>
        <p className="text-[14px] leading-[120%] font-medium text-white/50">
          Empower your Sub-affiliates with custom commission rates. Earn passive
          commissions from every trade made by Referees deep within your
          network.
        </p>
        <MLRUpgradeWarning />
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="i-svg-spinners:pulse-rings-multiple w-4 h-4"></div>
            Loading...
          </div>
        ) : (
          <Button
            className="w-fit text-[16px] leading-[120%] font-medium"
            onClick={onUpgradeClick}
          >
            Upgrade to Multi-Level
          </Button>
        )}
      </div>
    </Card>
  );
}

export function MLRUpgradeWarning() {
  return (
    <div className="flex  gap-[4px] rounded-[8px] p-3 bg-[#D9AB52]/20">
      <WarningIcon />
      <div className="ml-3">
        <ul className="list-disc ml-2 text-[#D9AB52] font-semibold text-[12px] leading-[15px] tracking-[0.03em] space-y-1">
          <li>
            This upgrade is permanent. You will not be able to switch back to
            Single-level referral.
          </li>
          <li>
            You will no longer be able to create new Single-level referral
            codes.
          </li>
          <li>
            Your existing Single-level codes will remain editable and active.
          </li>
        </ul>
      </div>
    </div>
  );
}
