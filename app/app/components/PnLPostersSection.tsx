import { useState } from "react";
import ImagePaste from "./ImagePaste";
import { Button } from "./Button";
import { Card } from "./Card";
import { SharePnLDialogWidget } from "@orderly.network/ui-share";
import { OrderlyAppProvider } from "@orderly.network/react-app";
import { WalletConnectorProvider } from "@orderly.network/wallet-connector";

interface PnLPostersSectionProps {
  pnlPosters: (string | null)[];
  onChange: (posters: (string | null)[]) => void;
  idPrefix?: string;
}

export default function PnLPostersSection({
  pnlPosters,
  onChange,
  idPrefix = "",
}: PnLPostersSectionProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handlePosterChange = (index: number) => (value: string | null) => {
    const newPosters = [...pnlPosters];
    newPosters[index] = value;
    onChange(newPosters);
  };

  const addPoster = () => {
    if (pnlPosters.length < 8) {
      onChange([...pnlPosters, null]);
    }
  };

  const removePoster = (index: number) => {
    const newPosters = pnlPosters.filter((_, i) => i !== index);
    onChange(newPosters);
  };

  const getPosterImageType = () => "pnlPoster" as const;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-md font-medium">
            PnL Sharing Backgrounds{" "}
            <span className="text-gray-400 text-sm font-normal">
              (optional)
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Custom background images for PnL sharing feature. Users can choose
            from these when sharing their trading results.
          </p>
        </div>
        {pnlPosters.length < 8 && (
          <Button
            type="button"
            onClick={addPoster}
            variant="secondary"
            size="sm"
            className="shrink-0"
          >
            <span className="flex items-center gap-1.5">
              <div className="i-mdi:plus h-4 w-4"></div>
              Add Poster
            </span>
          </Button>
        )}
      </div>

      {pnlPosters.length === 0 ? (
        <Card variant="default" className="p-6 text-center">
          <div className="i-mdi:image-multiple-outline h-12 w-12 mx-auto text-gray-500 mb-3"></div>
          <p className="text-sm text-gray-400 mb-3">
            No PnL poster backgrounds added yet.
          </p>
          <Button type="button" onClick={addPoster} variant="primary" size="sm">
            <span className="flex items-center gap-1.5">
              <div className="i-mdi:plus h-4 w-4"></div>
              Add First Poster
            </span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pnlPosters.map((poster, index) => (
            <div key={index} className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-200">
                  Poster {index + 1}
                </label>
                <button
                  type="button"
                  onClick={() => removePoster(index)}
                  className="text-xs text-error hover:text-error/70 transition-colors"
                >
                  Remove
                </button>
              </div>
              <ImagePaste
                id={`${idPrefix}pnlPoster${index}`}
                label=""
                value={poster || undefined}
                onChange={handlePosterChange(index)}
                imageType={getPosterImageType()}
                helpText="16:9 aspect ratio required (960x540px recommended)"
              />
            </div>
          ))}
        </div>
      )}

      {pnlPosters.length > 0 && pnlPosters.length < 8 && (
        <div className="text-center">
          <Button
            type="button"
            onClick={addPoster}
            variant="secondary"
            size="sm"
          >
            <span className="flex items-center gap-1.5">
              <div className="i-mdi:plus h-4 w-4"></div>
              Add Another Poster ({pnlPosters.length}/8)
            </span>
          </Button>
        </div>
      )}

      <Card variant="default" className="p-3 text-xs text-gray-400">
        <p>
          <span className="font-medium text-primary-light">
            About PnL Posters:
          </span>{" "}
          These custom background images will be available to users when sharing
          their trading PnL (Profit and Loss) results on social media.
        </p>
        <p className="mt-1">
          You can add up to 8 custom backgrounds. If none are provided, default
          backgrounds will be used.
        </p>
      </Card>

      {/* Preview button and widget */}
      <div className="border-t border-gray-600/30 pt-4">
        <Button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          variant="secondary"
          size="sm"
        >
          <span className="flex items-center gap-1.5">
            <div
              className={`h-4 w-4 ${showPreview ? "i-mdi:eye-off-outline" : "i-mdi:eye-outline"}`}
            ></div>
            {showPreview ? "Hide" : "Preview"} PnL Sharing
          </span>
        </Button>

        {showPreview && (
          <div className="mt-4 slide-fade-in">
            <WalletConnectorProvider>
              <OrderlyAppProvider
                brokerId="orderly"
                brokerName="Orderly"
                networkId="testnet"
              >
                <div className="border border-primary-light/20 rounded-lg p-4 bg-background-light/50">
                  <p className="text-xs text-gray-400 mb-3">
                    Preview of PnL sharing widget with your custom backgrounds:
                  </p>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    action="#"
                    method="get"
                  >
                    <SharePnLDialogWidget
                      pnl={{
                        entity: {
                          symbol: "PERP_ETH_USDC",
                          roi: 1.22 * 100,
                          side: "LONG",
                          openPrice: 2518.74,
                          openTime: 1725345164501,
                          markPrice: 2518.81,
                          quantity: 0.0794,
                        },
                        leverage: 10,
                        backgroundImages: pnlPosters as string[],
                      }}
                    />
                  </form>
                </div>
              </OrderlyAppProvider>
            </WalletConnectorProvider>
          </div>
        )}
      </div>
    </div>
  );
}
