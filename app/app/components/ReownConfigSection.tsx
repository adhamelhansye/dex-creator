import React from "react";
import FormInput from "./FormInput";
import { Card } from "./Card";

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
    <Card className="mb-4 p-4 slide-fade-in" variant="default">
      <div className="flex items-start gap-3">
        <div className="i-mdi:wallet-outline text-primary-light h-5 w-5 mt-0.5 flex-shrink-0"></div>
        <div>
          <p className="text-sm text-primary-light font-medium mb-2">
            Enhanced Wallet Connectivity with Reown
          </p>
          <p className="text-sm text-gray-300 mb-3">
            <span className="text-primary-light font-medium">
              What is Reown?
            </span>{" "}
            Reown (formerly WalletConnect) provides a superior wallet connection
            experience that goes far beyond basic browser wallet integration.
          </p>

          <div className="space-y-3">
            <div>
              <h4 className="text-base font-bold text-secondary-light mb-1">
                🚀 Key Benefits for Your DEX Users:
              </h4>
              <ul className="text-sm text-gray-300 list-disc pl-4 space-y-1">
                <li>
                  <strong>Mobile Wallet Support:</strong> Users can connect
                  mobile wallets like MetaMask Mobile, Trust Wallet, and 300+
                  others via QR code scanning
                </li>
                <li>
                  <strong>Cross-Platform Access:</strong> Desktop users can
                  connect to mobile wallets seamlessly, and mobile users get
                  native app connections
                </li>
                <li>
                  <strong>Universal Compatibility:</strong> Works with virtually
                  every major wallet, not just browser extensions
                </li>
                <li>
                  <strong>Better UX:</strong> Clean, modern connection modal
                  with wallet detection and connection status
                </li>
                <li>
                  <strong>Secure Connections:</strong> Encrypted peer-to-peer
                  connections between your DEX and user wallets
                </li>
              </ul>
            </div>

            <div className="bg-background-dark/50 p-3 rounded-lg border border-secondary-light/10">
              <h4 className="text-base font-bold text-warning mb-1">
                💡 Why This Matters:
              </h4>
              <p className="text-sm text-gray-400">
                Without Reown, your DEX can only connect to browser extension
                wallets (like MetaMask desktop). With Reown, mobile users can
                scan a QR code to connect their mobile wallets, dramatically
                expanding your potential user base and improving accessibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <FormInput
      id={`${idPrefix}walletConnectProjectId`}
      label="Reown Project ID"
      value={walletConnectProjectId}
      onChange={handleInputChange("walletConnectProjectId")}
      placeholder="Enter your Reown Project ID"
      helpText={
        <>
          <div className="space-y-3">
            <div>
              <strong className="text-primary-light">
                How to get your free Project ID:
              </strong>
              <ol className="list-decimal pl-4 mt-1 space-y-1 text-sm">
                <li>
                  Visit{" "}
                  <a
                    href="https://dashboard.reown.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light hover:underline"
                  >
                    Reown Dashboard
                  </a>{" "}
                  and create a free account
                </li>
                <li>Click "Create Project" and give your project a name</li>
                <li>
                  Select <strong>WalletKit</strong> as the product type
                </li>
                <li>
                  Choose <strong>JavaScript</strong> as the platform
                </li>
                <li>Copy the Project ID from your dashboard</li>
              </ol>
            </div>

            <div className="bg-background-dark/30 p-3 rounded-lg border border-primary-light/10">
              <h4 className="text-base font-bold text-primary-light mb-1">
                🔗 Integration Notes:
              </h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>
                  • Your DEX will work perfectly fine without this - it's purely
                  an enhancement
                </li>
                <li>
                  • If you enable Privy integration, Privy will automatically
                  use this Project ID
                </li>
                <li>
                  • Free tier includes 10,000 monthly active wallets - more than
                  enough for most DEXes
                </li>
                <li>
                  • No additional configuration needed - just paste your Project
                  ID and you're done!
                </li>
              </ul>
            </div>

            <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
              <h4 className="text-base font-bold text-warning mb-1">
                ⚠️ Important: Domain Allowlist Configuration Required
              </h4>
              <p className="text-sm text-gray-300 mb-2">
                After creating your project, you <strong>MUST</strong> configure
                the domain allowlist in your Reown dashboard for your DEX to
                work properly.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  <strong>How to configure domains:</strong>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-sm text-gray-400">
                  <li>
                    Go to your project dashboard at{" "}
                    <a
                      href="https://dashboard.reown.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-light hover:underline"
                    >
                      dashboard.reown.com
                    </a>
                  </li>
                  <li>Navigate to the "Domain" section</li>
                  <li>Click "Domain" to add your DEX domain</li>
                  <li>
                    Add your domain (e.g.,{" "}
                    <code className="bg-background-dark px-1 rounded">
                      https://yourdex.com
                    </code>
                    )
                  </li>
                </ol>
                <div className="mt-2 p-2 bg-background-dark/50 rounded border border-gray-600/30">
                  <p className="text-xs text-gray-400">
                    <strong>💡 Pro tip:</strong> You can use wildcards like{" "}
                    <code className="bg-background-dark px-1 rounded">
                      https://*.subdomain.com
                    </code>{" "}
                    to allow all subdomains.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      }
    />
  </>
);

export default ReownConfigSection;
