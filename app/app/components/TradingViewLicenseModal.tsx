import { Button } from "./Button";

interface TradingViewLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TradingViewLicenseModal({
  isOpen,
  onClose,
}: TradingViewLicenseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-[1002] w-full max-w-2xl p-6 rounded-xl bg-background-light border border-light/10 shadow-2xl slide-fade-in max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">TradingView License Guide</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <div className="i-mdi:close h-5 w-5"></div>
          </button>
        </div>

        <div className="space-y-6">
          {/* Free License Notice */}
          <div className="bg-success/10 rounded-lg border border-success/20 p-4">
            <div className="flex items-start gap-3">
              <div className="i-mdi:check-circle text-success h-5 w-5 mt-0.5 flex-shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium mb-1 text-success">
                  Good News: It's Completely Free!
                </h4>
                <p className="text-xs text-gray-300">
                  The TradingView Advanced Charts license is free for commercial
                  use. You just need to fill out their application form to get
                  approved.
                </p>
              </div>
            </div>
          </div>

          {/* What You Need */}
          <div>
            <h4 className="text-sm font-medium mb-3">What You Need to Do</h4>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>
                Visit the{" "}
                <a
                  href="https://www.tradingview.com/advanced-charts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:underline"
                >
                  TradingView Advanced Charts page
                </a>
              </li>
              <li>Click on "Get the library" to open the application form</li>
              <li>Fill out the form with the details provided below</li>
              <li>Wait for approval (usually takes a few business days)</li>
            </ol>
          </div>

          {/* Where to Click Image */}
          <div>
            <h4 className="text-sm font-medium mb-3">Where to Click</h4>
            <div className="bg-background-dark/50 rounded-lg p-4 border border-light/10">
              <img
                src="/advanced-charts.webp"
                alt="TradingView Advanced Charts page showing where to click to request a license"
                className="w-full rounded border border-light/20"
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Look for the "Get the library" button on the TradingView
                Advanced Charts page
              </p>
            </div>
          </div>

          {/* Application Details */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Application Form Details
            </h4>
            <div className="bg-background-dark/50 rounded-lg p-4 border border-light/10 space-y-3">
              <div>
                <span className="text-xs font-medium text-primary-light">
                  Website URL:
                </span>
                <p className="text-xs text-gray-300 mt-1">
                  Use your custom domain (the one you're setting up in the
                  Custom Domain section)
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-primary-light">
                  GitHub Profile:
                </span>
                <p className="text-xs text-gray-300 mt-1">
                  You'll need to create a personal{" "}
                  <a
                    href="https://github.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:underline"
                  >
                    GitHub account
                  </a>
                  . Even though you won't need direct access to their library
                  (we've already handled that), it's required for the
                  application process.
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-primary-light">
                  Company Profile:
                </span>
                <p className="text-xs text-gray-300 mt-1">"Crypto Exchange"</p>
              </div>

              <div>
                <span className="text-xs font-medium text-primary-light">
                  Own Data Feed:
                </span>
                <p className="text-xs text-gray-300 mt-1">Yes</p>
              </div>

              <div>
                <span className="text-xs font-medium text-primary-light">
                  Reason for Request:
                </span>
                <p className="text-xs text-gray-300 mt-1">
                  Mention that this is for a perpetual futures decentralized
                  exchange
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-warning/10 rounded-lg border border-warning/20 p-4">
            <div className="flex items-start gap-3">
              <div className="i-mdi:information-outline text-warning h-5 w-5 mt-0.5 flex-shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-warning">
                  Important Notes
                </h4>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  <li>
                    The license application is free and typically approved
                    within a few business days
                  </li>
                  <li>
                    You must apply using your custom domain, not the GitHub
                    Pages URL
                  </li>
                  <li>
                    The GitHub account requirement is just for their application
                    process
                  </li>
                  <li>
                    Once approved, your DEX will continue working normally with
                    the TradingView charts
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <Button
              as="a"
              href="https://www.tradingview.com/advanced-charts/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
            >
              <span className="flex items-center gap-2">
                Apply for TradingView License
                <div className="i-mdi:open-in-new h-4 w-4"></div>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
