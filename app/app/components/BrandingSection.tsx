import React from "react";
import ImagePaste from "./ImagePaste";

export interface BrandingProps {
  primaryLogo: Blob | null;
  secondaryLogo: Blob | null;
  favicon: Blob | null;
  handleImageChange: (field: string) => (blob: Blob | null) => void;
  idPrefix?: string;
}

const BrandingSection: React.FC<BrandingProps> = ({
  primaryLogo,
  secondaryLogo,
  favicon,
  handleImageChange,
  idPrefix = "",
}) => (
  <>
    <div className="mb-6">
      <ImagePaste
        id={`${idPrefix}primaryLogo`}
        label={
          <>
            Primary Logo{" "}
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </>
        }
        value={primaryLogo || undefined}
        onChange={handleImageChange("primaryLogo")}
        imageType="primaryLogo"
        helpText="This will be used as the main logo in your DEX, typically displayed prominently on desktop views."
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ImagePaste
        id={`${idPrefix}secondaryLogo`}
        label={
          <>
            Secondary Logo{" "}
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </>
        }
        value={secondaryLogo || undefined}
        onChange={handleImageChange("secondaryLogo")}
        imageType="secondaryLogo"
        helpText="This will be used in other areas like the footer, on mobile views, and in some dialogs."
      />
      <ImagePaste
        id={`${idPrefix}favicon`}
        label={
          <>
            Favicon{" "}
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </>
        }
        value={favicon || undefined}
        onChange={handleImageChange("favicon")}
        imageType="favicon"
        helpText="This is the small icon that appears next to your website's name in a browser tab or in a list of bookmarks, helping users easily identify your DEX."
      />
    </div>
  </>
);

export default BrandingSection;
