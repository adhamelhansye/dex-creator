import React from "react";
import FormInput from "./FormInput";
import { Card } from "./Card";

export interface PrivyConfigProps {
  privyAppId: string;
  privyTermsOfUse: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  urlValidator: (value: string) => string | null;
  enableAbstractWallet: boolean;
  onEnableAbstractWalletChange: (checked: boolean) => void;
  idPrefix?: string;
}

const PrivyConfigSection: React.FC<PrivyConfigProps> = ({
  privyAppId,
  privyTermsOfUse,
  handleInputChange,
  urlValidator,
  enableAbstractWallet,
  onEnableAbstractWalletChange,
  idPrefix = "",
}) => {
  const isPrivyConfigured = privyAppId.trim() !== "";

  return (
    <>
      <Card className="mb-3 p-3 slide-fade-in" variant="default">
        <div className="flex items-start gap-2">
          <div className="i-mdi:information-outline text-primary-light h-4 w-4 mt-0.5 flex-shrink-0"></div>
          <div>
            <p className="text-xs text-primary-light font-medium mb-1">
              Privy provides enhanced wallet connection options
            </p>
            <p className="text-xs text-gray-300 mb-1">
              <span className="text-primary-light font-medium">
                Why use Privy?
              </span>{" "}
              Privy provides multiple wallet connection options:
            </p>
            <ul className="text-xs text-gray-300 list-disc pl-4 space-y-0.5">
              <li>Social logins (Google, Discord, Twitter)</li>
              <li>Email/phone authentication</li>
              <li>Multiple wallet types from a single interface</li>
              <li>Embedded wallets for non-crypto users</li>
            </ul>
          </div>
        </div>
      </Card>
      <FormInput
        id={`${idPrefix}privyAppId`}
        label={
          <div className="flex items-center gap-1">
            Privy App ID
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </div>
        }
        value={privyAppId}
        onChange={handleInputChange("privyAppId")}
        placeholder="Enter your Privy App ID"
        helpText={
          <>
            Get a Privy App ID by signing up at{" "}
            <a
              href="https://console.privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-light hover:underline"
            >
              Privy Console
            </a>
            . When creating an app, be sure to select{" "}
            <strong>client-side</strong> and <strong>web</strong> options.
            You'll find your App ID in the app settings.
          </>
        }
      />
      <FormInput
        id={`${idPrefix}privyTermsOfUse`}
        label={
          <div className="flex items-center gap-1">
            Privy Terms of Use URL
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </div>
        }
        value={privyTermsOfUse}
        onChange={handleInputChange("privyTermsOfUse")}
        type="url"
        placeholder="https://example.com/terms"
        validator={urlValidator}
        helpText={
          <>
            Enter the URL to your terms of service that will be displayed during
            Privy login. This is optional and only needed if you want to show
            terms during the login process. Must be a valid URL if provided.
          </>
        }
      />
      <div className="mt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id={`${idPrefix}enableAbstractWallet`}
            checked={enableAbstractWallet}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onEnableAbstractWalletChange(e.target.checked)
            }
            disabled={!isPrivyConfigured}
            className="form-checkbox mt-1 rounded bg-dark border-gray-500 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <div
              className={`text-sm font-medium ${!isPrivyConfigured ? "text-gray-500" : "text-gray-200"}`}
            >
              Enable Abstract Wallet (via Privy)
            </div>
            <div
              className={`text-xs mt-1 ${!isPrivyConfigured ? "text-gray-600" : "text-gray-400"}`}
            >
              {isPrivyConfigured
                ? "Allows users to sign transactions using abstract wallets (e.g., social logins) when Privy is configured. This requires a Privy App ID to be set above."
                : "Requires a Privy App ID to be set above before this can be enabled."}
            </div>
          </div>
        </label>
      </div>
    </>
  );
};

export default PrivyConfigSection;
