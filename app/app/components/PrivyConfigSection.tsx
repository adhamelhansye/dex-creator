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
  idPrefix?: string;
}

const PrivyConfigSection: React.FC<PrivyConfigProps> = ({
  privyAppId,
  privyTermsOfUse,
  handleInputChange,
  urlValidator,
  idPrefix = "",
}) => (
  <>
    <Card
      className="mb-3 p-3 slide-fade-in"
      variant={
        (privyAppId && !privyTermsOfUse) || (!privyAppId && privyTermsOfUse)
          ? "warning"
          : "default"
      }
    >
      <div className="flex items-start gap-2">
        <div
          className={`${(privyAppId && !privyTermsOfUse) || (!privyAppId && privyTermsOfUse) ? "i-mdi:alert-circle-outline text-warning" : "i-mdi:information-outline text-primary-light"} h-4 w-4 mt-0.5 flex-shrink-0`}
        ></div>
        <div>
          <p className="text-xs text-warning font-medium mb-1">
            If using Privy, both App ID and Terms of Use URL must be set for it
            to function!
          </p>
          {((privyAppId && !privyTermsOfUse) ||
            (!privyAppId && privyTermsOfUse)) && (
            <p className="text-xs text-gray-300 mb-2 border-l-2 border-warning pl-2">
              You've only set one of the required Privy fields. Either set both
              fields or leave both empty.
            </p>
          )}
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
          <>
            Privy App ID
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </>
          {privyTermsOfUse && !privyAppId && (
            <div className="ml-2 text-warning text-xs flex items-center">
              <div className="i-mdi:alert-circle-outline mr-1 h-3.5 w-3.5"></div>
              Required with Terms URL
            </div>
          )}
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
          . When creating an app, be sure to select <strong>client-side</strong>{" "}
          and <strong>web</strong> options. You'll find your App ID in the app
          settings.{" "}
          {privyTermsOfUse && !privyAppId && (
            <span className="text-warning">
              Required when Terms URL is set.
            </span>
          )}
        </>
      }
    />
    <FormInput
      id={`${idPrefix}privyTermsOfUse`}
      label={
        <div className="flex items-center gap-1">
          <>
            Privy Terms of Use URL
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </>
          {privyAppId && !privyTermsOfUse && (
            <div className="ml-2 text-warning text-xs flex items-center">
              <div className="i-mdi:alert-circle-outline mr-1 h-3.5 w-3.5"></div>
              Required with App ID
            </div>
          )}
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
          Privy login.{" "}
          {privyAppId && !privyTermsOfUse && (
            <span className="text-warning">Required when App ID is set.</span>
          )}{" "}
          Must be a valid URL.
        </>
      }
    />
  </>
);

export default PrivyConfigSection;
