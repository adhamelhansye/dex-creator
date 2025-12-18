import React from "react";
import { toast } from "react-toastify";
import { Card } from "../../components";
import { ConfigureDistributorCodeModalUI } from "../configureDistributorCodeModal";
import type { ConfigureDistributorCodeModalUIProps } from "../configureDistributorCodeModal";
import { copyText, formatCurrency, formatTier } from "../../utils";
import { CopyIcon, EditIcon, LinkIcon } from "../../icons";

interface OverviewUIProps {
  data: {
    distributorCode: string;
    historicalRevenueShare: number;
    brokerTier: string;
    distributorUrl: string;
  };
  onEditCode: () => void;
  configureDistributorCodeModalUiProps: ConfigureDistributorCodeModalUIProps;
  isLoading?: boolean;
}

const ActionList = ({
  code,
  url,
  onEdit,
}: {
  code: string;
  url: string;
  onEdit: () => void;
}) => (
  <div className="flex items-center gap-2">
    {/* Edit */}
    <button
      onClick={onEdit}
      className="text-base-contrast-54 hover:text-base-contrast transition-colors"
      aria-label="Edit"
    >
      <EditIcon className="w-4 h-4" />
    </button>
    <div className="w-[1px] h-3 bg-base-contrast-12" />
    {/* Copy code */}
    <button
      onClick={() => {
        copyText(code);
        toast.success("Copied to clipboard");
      }}
      className="text-base-contrast-54 hover:text-base-contrast transition-colors"
      aria-label="Copy code"
    >
      <CopyIcon className="w-4 h-4" />
    </button>
    <div className="w-[1px] h-3 bg-base-contrast-12" />
    {/* Copy URL */}
    <button
      onClick={() => {
        copyText(url);
        toast.success("Copied to clipboard");
      }}
      className="text-base-contrast-54 hover:text-base-contrast transition-colors"
      aria-label="Copy URL"
    >
      <LinkIcon className="w-4 h-4" />
    </button>
  </div>
);

const OverviewUI: React.FC<OverviewUIProps> = ({
  data,
  onEditCode,
  configureDistributorCodeModalUiProps,
  isLoading,
}) => {
  if (isLoading) {
    return <div className="h-[140px] bg-base-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className="bg-base-800 rounded-lg py-6">
      <div className="flex flex-col md:flex-row gap-5">
        <Card
          title="Distributor code"
          content={
            <div className="flex gap-3 items-center">
              <span>{data.distributorCode}</span>
              <ActionList
                code={data.distributorCode}
                url={data.distributorUrl}
                onEdit={onEditCode}
              />
            </div>
          }
        />
        <Card
          title="Historical revenue share"
          content={formatCurrency(data.historicalRevenueShare, {
            floor: true,
            precison: 2,
          })}
          showInfoIcon={true}
          infoTooltip="Your total revenue share to date from the Vanguard distributor programme."
        />
        <Card
          title="My broker tier"
          content={formatTier(data.brokerTier)}
          showInfoIcon={true}
          infoTooltip="Your latest broker tier."
        />
      </div>
      <ConfigureDistributorCodeModalUI
        {...configureDistributorCodeModalUiProps}
      />
    </div>
  );
};

export default OverviewUI;
