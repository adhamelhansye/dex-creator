import React from "react";
import FormInput from "./FormInput";

export interface SocialLinksProps {
  telegramLink: string;
  discordLink: string;
  xLink: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  urlValidator: (value: string) => string | null;
  idPrefix?: string;
}

const SocialLinksSection: React.FC<SocialLinksProps> = ({
  telegramLink,
  discordLink,
  xLink,
  handleInputChange,
  urlValidator,
  idPrefix = "",
}) => (
  <>
    <FormInput
      id={`${idPrefix}telegramLink`}
      label={
        <>
          Telegram URL{" "}
          <span className="text-gray-400 text-sm font-normal">(optional)</span>
        </>
      }
      value={telegramLink}
      onChange={handleInputChange("telegramLink")}
      type="url"
      placeholder="https://t.me/your-group"
      validator={urlValidator}
    />
    <FormInput
      id={`${idPrefix}discordLink`}
      label={
        <>
          Discord URL{" "}
          <span className="text-gray-400 text-sm font-normal">(optional)</span>
        </>
      }
      value={discordLink}
      onChange={handleInputChange("discordLink")}
      type="url"
      placeholder="https://discord.gg/your-server"
      validator={urlValidator}
    />
    <FormInput
      id={`${idPrefix}xLink`}
      label={
        <>
          Twitter/X URL{" "}
          <span className="text-gray-400 text-sm font-normal">(optional)</span>
        </>
      }
      value={xLink}
      onChange={handleInputChange("xLink")}
      type="url"
      placeholder="https://twitter.com/your-account"
      validator={urlValidator}
    />
  </>
);

export default SocialLinksSection;
