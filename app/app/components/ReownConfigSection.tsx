import React from "react";
import FormInput from "./FormInput";

export interface ReownConfigProps {
  walletConnectProjectId: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  idPrefix?: string;
}

const ReownConfigSection: React.FC<ReownConfigProps> = ({
  walletConnectProjectId,
  handleInputChange,
  idPrefix = "",
}) => (
  <>
    <FormInput
      id={`${idPrefix}walletConnectProjectId`}
      label={
        <>
          Reown Project ID{" "}
          <span className="text-gray-400 text-sm font-normal">(optional)</span>
        </>
      }
      value={walletConnectProjectId}
      onChange={handleInputChange("walletConnectProjectId")}
      placeholder="Enter your Reown Project ID"
      helpText={
        <>
          Get a free Project ID by creating a project at{" "}
          <a
            href="https://cloud.reown.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light hover:underline"
          >
            Reown Cloud
          </a>
          . When creating a project, select <strong>WalletKit</strong> as the
          product, and then choose <strong>JavaScript</strong> as the platform
          in the next step.
          <span className="block mt-1">
            If you enable Privy integration, Privy will use this Project ID for
            its WalletConnect functionality. You do not need to configure
            WalletConnect separately in the Privy dashboard.
          </span>
        </>
      }
    />
  </>
);

export default ReownConfigSection;
