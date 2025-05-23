import { useState, useRef, useEffect, FC } from "react";
import { NetworkId } from "@orderly.network/types";
import usePreviewConfig from "../hooks/usePreviewConfig";
import { Button } from "./Button";

interface PreviewButtonProps {
  // DEX configuration - now just needs brokerName
  brokerName: string;
  networkId?: NetworkId;
  initialSymbol?: string;
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  themeCSS?: string | null;

  // Button styling
  className?: string;
  buttonText?: string;
}

/**
 * PreviewButton - A button component that shows a preview of the DEX inline
 *
 * This component handles the state and configuration needed to display
 * a preview of the DEX directly on the page in an iframe.
 */
const PreviewButton: FC<PreviewButtonProps> = ({
  brokerName,
  networkId = "testnet",
  initialSymbol = "PERP_BTC_USDC",
  primaryLogo = null,
  secondaryLogo = null,
  themeCSS = null,
  className = "",
  buttonText = "Preview DEX",
}) => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { configUpdated } = usePreviewConfig(
    brokerName,
    networkId,
    initialSymbol,
    primaryLogo,
    secondaryLogo,
    themeCSS
  );

  const togglePreview = () => {
    if (!isPreviewVisible) {
      // When opening the preview, set loading state
      setIsLoading(true);
    }
    setIsPreviewVisible(!isPreviewVisible);
  };

  // If preview is visible and the config has changed, reload the iframe
  useEffect(() => {
    if (isPreviewVisible && iframeRef.current && configUpdated) {
      // Use this approach to reload the iframe content
      const iframe = iframeRef.current;
      iframe.src = iframe.src;
    }
  }, [configUpdated, isPreviewVisible]);

  // URL for the preview iframe - now we don't need to pass config in the URL
  const iframeUrl = "/preview";

  return (
    <div className="mt-4 w-full overflow-visible">
      <Button variant="secondary" onClick={togglePreview} className={className}>
        {isPreviewVisible ? (
          <span className="flex items-center gap-1">
            <span className="i-mdi:eye-off-outline h-4 w-4"></span>
            Hide Preview
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="i-mdi:eye-outline h-4 w-4"></span>
            {buttonText}
          </span>
        )}
      </Button>

      {isPreviewVisible && (
        <div className="mt-4 relative">
          <div
            ref={containerRef}
            className="relative mt-4 border border-primary-light/10 rounded-xl overflow-hidden bg-background-light animate-slide-fade-in shadow-lg h-xl lg:h-[28rem] xl:h-[32rem] 2xl:h-[40rem] 3xl:h-[50rem] md:w-[calc(100%+4rem)] lg:w-[calc(100%+8rem)] xl:w-[calc(100%+12rem)] 2xl:w-[calc(100%+16rem)] 3xl:w-[calc(100%+24rem)] md:-mx-8 lg:-mx-16 xl:-mx-24 2xl:-mx-32 3xl:-mx-48"
          >
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background-dark/50 z-20">
                <div className="text-center">
                  <div className="i-svg-spinners:pulse-rings-multiple w-12 h-12 mx-auto text-primary-light mb-4"></div>
                  <p className="text-white">Loading DEX Preview...</p>
                </div>
              </div>
            )}

            {/* Use an iframe to load the preview in an isolated environment */}
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title={`DEX Preview - ${brokerName}`}
            />
          </div>

          <div className="mt-2 text-xs text-gray-400 flex justify-between items-center">
            <div>
              Preview of{" "}
              <span className="text-primary-light">{brokerName}</span> DEX
              {(primaryLogo || secondaryLogo) && (
                <span className="ml-2 text-success">
                  <span className="i-mdi:check-circle h-3 w-3 inline-block mr-1" />
                  with custom branding
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Powered by{" "}
              <span className="text-primary-light">Orderly Network</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewButton;
